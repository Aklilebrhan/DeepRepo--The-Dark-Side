import {
  OllamaClient as BaseOllamaClient,
  type OllamaClientOptions,
  type GenerateOptions,
  type ChatOptions,
  type ChatMessage,
} from '@deeprepo/llm-bridge';
import { FALLBACK_LLM_MODEL } from '../constants';

export class OllamaClient extends BaseOllamaClient {
  constructor(options: OllamaClientOptions = {}) {
    super(options);
  }

  /**
   * Generates completion with automatic fallback to secondary model if primary fails
   */
  public async *streamGenerateWithFallback(
    options: GenerateOptions,
  ): AsyncGenerator<string, void, unknown> {
    try {
      for await (const token of this.streamGenerate(options)) {
        yield token;
      }
    } catch (primaryErr: any) {
      // If primary model failed (e.g. model not found), attempt fallback model
      const fallbackModel = FALLBACK_LLM_MODEL;
      if (options.model !== fallbackModel) {
        try {
          yield `\n[Notice: Falling back to ${fallbackModel}]\n`;
          for await (const token of this.streamGenerate({ ...options, model: fallbackModel })) {
            yield token;
          }
          return;
        } catch {
          // If fallback fails too, rethrow original error
        }
      }
      throw primaryErr;
    }
  }
}

export type { GenerateOptions, ChatOptions, ChatMessage };
