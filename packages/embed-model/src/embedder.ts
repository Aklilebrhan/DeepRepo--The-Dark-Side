import { ModelLoader } from './loader';
import { EMBEDDING_DIMENSION } from '@deeprepo/config';

export interface EmbedderOptions {
  modelName?: string;
  cacheDir?: string;
  batchSize?: number;
  offlineFallbackOnly?: boolean;
}

export class CodeEmbedder {
  private loader: ModelLoader;
  private batchSize: number;
  private offlineFallbackOnly: boolean;

  constructor(options: EmbedderOptions = {}) {
    this.loader = new ModelLoader({
      modelName: options.modelName,
      cacheDir: options.cacheDir,
    });
    this.batchSize = options.batchSize || 64;
    this.offlineFallbackOnly =
      options.offlineFallbackOnly ??
      (process.env.OFFLINE_EMBEDDINGS === 'true' || process.env.NODE_ENV === 'test');
  }

  public getLoader(): ModelLoader {
    return this.loader;
  }

  public setOfflineFallbackOnly(value: boolean): void {
    this.offlineFallbackOnly = value;
  }

  /**
   * Generates a normalized 384-dimensional vector embedding for a single text
   */
  public async embedText(text: string, isQuery = false): Promise<number[]> {
    const prefixed = isQuery ? `search_query: ${text}` : `search_document: ${text}`;
    const [embedding] = await this.embedBatch([prefixed]);
    return embedding;
  }

  /**
   * Embeds multiple texts in batches
   */
  public async embedBatch(texts: string[], isQuery = false): Promise<number[][]> {
    if (texts.length === 0) return [];

    const formattedTexts = texts.map((t) =>
      isQuery
        ? t.startsWith('search_query:')
          ? t
          : `search_query: ${t}`
        : t.startsWith('search_document:')
          ? t
          : `search_document: ${t}`,
    );

    const results: number[][] = [];

    for (let i = 0; i < formattedTexts.length; i += this.batchSize) {
      const batch = formattedTexts.slice(i, i + this.batchSize);
      const batchVectors = await this.processBatch(batch);
      results.push(...batchVectors);
    }

    return results;
  }

  private async processBatch(batch: string[]): Promise<number[][]> {
    if (this.offlineFallbackOnly) {
      return batch.map((text) => this.generateDeterministicVector(text, EMBEDDING_DIMENSION));
    }

    try {
      // Race loading pipeline with 1.5s timeout if offline/no network
      const loadPromise = this.loader.loadPipeline();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Model load timeout')), 1500),
      );

      const pipeline = await Promise.race([loadPromise, timeoutPromise]);
      const outputs = await (pipeline as any)(batch, { pooling: 'mean', normalize: true });

      const vectors: number[][] = [];
      const data = outputs.data;
      const dims = EMBEDDING_DIMENSION;

      for (let i = 0; i < batch.length; i++) {
        const start = i * dims;
        const vec = Array.from(data.slice(start, start + dims)) as number[];
        vectors.push(vec);
      }
      return vectors;
    } catch {
      // Offline fallback: deterministic pseudo-embedding based on hash & character frequency
      return batch.map((text) => this.generateDeterministicVector(text, EMBEDDING_DIMENSION));
    }
  }

  /**
   * Deterministic embedding fallback when offline model runtime is initializing or testing
   */
  public generateDeterministicVector(text: string, dimension = EMBEDDING_DIMENSION): number[] {
    const vec = new Array(dimension).fill(0);

    // Expand camelCase and snake_case for token matching
    const expandedText = text.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ');
    const words = expandedText.toLowerCase().split(/\W+/).filter(Boolean);

    // Word hashing with frequency & token importance
    for (let w = 0; w < words.length; w++) {
      const word = words[w];
      let wordHash = 5381;
      for (let c = 0; c < word.length; c++) {
        wordHash = (wordHash << 5) + wordHash + word.charCodeAt(c);
      }
      const idx = Math.abs(wordHash) % dimension;
      vec[idx] += 10.0;

      // Also hash 3-character n-grams for fuzzy sub-word matching
      if (word.length >= 3) {
        for (let g = 0; g <= word.length - 3; g++) {
          const gram = word.slice(g, g + 3);
          let gramHash = 5381;
          for (let c = 0; c < gram.length; c++) {
            gramHash = (gramHash << 5) + gramHash + gram.charCodeAt(c);
          }
          vec[Math.abs(gramHash) % dimension] += 2.0;
        }
      }
    }

    // Gentle character bigram background hashing
    for (let i = 0; i < text.length - 1; i++) {
      const charCode = (text.charCodeAt(i) << 8) | text.charCodeAt(i + 1);
      const idx = Math.abs(charCode) % dimension;
      vec[idx] += 0.1;
    }

    // Normalize
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1.0;
    return vec.map((v) => Number((v / norm).toFixed(6)));
  }
}
