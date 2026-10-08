import { ModelCacheManager } from './cacheManager';

export interface ModelLoaderOptions {
  modelName?: string;
  cacheDir?: string;
  maxRetries?: number;
}

export class ModelLoader {
  private modelName: string;
  private cacheManager: ModelCacheManager;
  private maxRetries: number;
  private pipelineInstance: any = null;

  constructor(options: ModelLoaderOptions = {}) {
    this.modelName = options.modelName || 'nomic-ai/nomic-embed-text-v1.5';
    this.maxRetries = options.maxRetries ?? 3;
    this.cacheManager = new ModelCacheManager({
      modelName: this.modelName,
      cacheDir: options.cacheDir,
    });
  }

  public getCacheManager(): ModelCacheManager {
    return this.cacheManager;
  }

  public getModelName(): string {
    return this.modelName;
  }

  /**
   * Loads the model pipeline with exponential backoff retry
   */
  public async loadPipeline(): Promise<any> {
    if (this.pipelineInstance) {
      return this.pipelineInstance;
    }

    const cachePath = this.cacheManager.ensureCacheDir();
    let attempt = 0;
    let delayMs = 500;

    while (attempt < this.maxRetries) {
      try {
        attempt++;
        // Dynamically import @xenova/transformers
        const { pipeline, env } = await import('@xenova/transformers');

        // Configure local cache path
        if (env) {
          env.cacheDir = cachePath;
          env.localModelPath = cachePath;
          env.allowRemoteModels = true;
        }

        this.pipelineInstance = await pipeline('feature-extraction', this.modelName, {
          quantized: true,
        });

        return this.pipelineInstance;
      } catch (err: any) {
        if (attempt >= this.maxRetries) {
          throw new Error(
            `Failed to load embedding model ${this.modelName} after ${this.maxRetries} attempts: ${err.message}`,
          );
        }
        await new Promise((res) => setTimeout(res, delayMs));
        delayMs *= 2; // exponential backoff
      }
    }
  }

  public setPipelineMock(mockPipeline: any): void {
    this.pipelineInstance = mockPipeline;
  }
}
