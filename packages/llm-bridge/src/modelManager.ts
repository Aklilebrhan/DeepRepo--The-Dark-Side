import { DEFAULT_LLM_HOST } from '@deeprepo/config';

export interface OllamaModelInfo {
  name: string;
  size?: number;
  digest?: string;
  modified_at?: string;
}

export interface PullProgress {
  status: string;
  digest?: string;
  total?: number;
  completed?: number;
}

export class ModelManager {
  private host: string;

  constructor(host: string = DEFAULT_LLM_HOST) {
    this.host = host.replace(/\/$/, '');
  }

  public async isOllamaRunning(): Promise<boolean> {
    try {
      const response = await fetch(`${this.host}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  public async listModels(): Promise<OllamaModelInfo[]> {
    try {
      const response = await fetch(`${this.host}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) {
        throw new Error(`Failed to list models: HTTP ${response.status}`);
      }
      const data = (await response.json()) as { models?: OllamaModelInfo[] };
      return data.models || [];
    } catch (err: any) {
      throw new Error(`Cannot reach Ollama at ${this.host}: ${err.message}`);
    }
  }

  public async hasModel(modelName: string): Promise<boolean> {
    try {
      const models = await this.listModels();
      const target = modelName.toLowerCase();
      return models.some(
        (m) =>
          m.name.toLowerCase() === target ||
          m.name.toLowerCase().startsWith(`${target}:`) ||
          `${m.name.toLowerCase()}:latest` === target,
      );
    } catch {
      return false;
    }
  }

  public async pullModel(
    modelName: string,
    onProgress?: (progress: PullProgress) => void,
  ): Promise<void> {
    const response = await fetch(`${this.host}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: true }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Failed to pull model ${modelName}: HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const chunk = JSON.parse(line) as PullProgress;
          onProgress?.(chunk);
        } catch {
          // Ignore
        }
      }
    }
  }
}
