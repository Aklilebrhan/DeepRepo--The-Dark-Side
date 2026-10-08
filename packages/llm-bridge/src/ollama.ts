import { DEFAULT_LLM_HOST, DEFAULT_LLM_MODEL, LLM_TIMEOUT_MS } from '@deeprepo/config';
import { decodeOllamaStream } from './streamDecoder';
import { ModelManager } from './modelManager';

export interface OllamaClientOptions {
  host?: string;
  defaultModel?: string;
  timeoutMs?: number;
}

export interface GenerateOptions {
  model?: string;
  prompt: string;
  system?: string;
  stream?: boolean;
  temperature?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
}

export class OllamaClient {
  private host: string;
  private defaultModel: string;
  private timeoutMs: number;
  private modelManager: ModelManager;

  constructor(options: OllamaClientOptions = {}) {
    this.host = (options.host || DEFAULT_LLM_HOST).replace(/\/$/, '');
    this.defaultModel = options.defaultModel || DEFAULT_LLM_MODEL;
    this.timeoutMs = options.timeoutMs || LLM_TIMEOUT_MS;
    this.modelManager = new ModelManager(this.host);
  }

  public getModelManager(): ModelManager {
    return this.modelManager;
  }

  public getDefaultModel(): string {
    return this.defaultModel;
  }

  /**
   * Generates completion with token-by-token streaming
   */
  public async *streamGenerate(options: GenerateOptions): AsyncGenerator<string, void, unknown> {
    const model = options.model || this.defaultModel;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.host}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt: options.prompt,
          system: options.system,
          stream: true,
          options: {
            temperature: options.temperature ?? 0.2,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Ollama generation error: HTTP ${response.status} ${response.statusText}`);
      }

      for await (const chunk of decodeOllamaStream(response.body)) {
        if (chunk.response) {
          yield chunk.response;
        }
        if (chunk.done) {
          break;
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Ollama request timed out after ${this.timeoutMs / 1000} seconds`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Generates complete response without streaming
   */
  public async generate(options: GenerateOptions): Promise<string> {
    let result = '';
    for await (const token of this.streamGenerate(options)) {
      result += token;
    }
    return result;
  }

  /**
   * Multi-turn chat completion with streaming
   */
  public async *streamChat(options: ChatOptions): AsyncGenerator<string, void, unknown> {
    const model = options.model || this.defaultModel;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.host}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          messages: options.messages,
          stream: true,
          options: {
            temperature: options.temperature ?? 0.2,
          },
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Ollama chat error: HTTP ${response.status} ${response.statusText}`);
      }

      for await (const chunk of decodeOllamaStream(response.body)) {
        if (chunk.message?.content) {
          yield chunk.message.content;
        }
        if (chunk.done) {
          break;
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error(`Ollama chat request timed out after ${this.timeoutMs / 1000} seconds`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Multi-turn chat completion returning full string
   */
  public async chat(options: ChatOptions): Promise<string> {
    let result = '';
    for await (const token of this.streamChat(options)) {
      result += token;
    }
    return result;
  }
}
