import { CodeEmbedder } from '@deeprepo/embed-model';
import { CodeChunk, VectorDocument } from '../types';

export interface EmbeddingPipelineOptions {
  batchSize?: number;
  modelName?: string;
  cacheDir?: string;
}

export class EmbeddingPipeline {
  private embedder: CodeEmbedder;
  private batchSize: number;

  constructor(options: EmbeddingPipelineOptions = {}) {
    this.batchSize = options.batchSize || 64;
    this.embedder = new CodeEmbedder({
      batchSize: this.batchSize,
      modelName: options.modelName,
      cacheDir: options.cacheDir,
    });
  }

  public getEmbedder(): CodeEmbedder {
    return this.embedder;
  }

  /**
   * Vectorizes code chunks into VectorDocument entries
   */
  public async vectorizeChunks(
    chunks: CodeChunk[],
    onProgress?: (done: number, total: number) => void,
  ): Promise<VectorDocument[]> {
    if (chunks.length === 0) return [];

    const documents: VectorDocument[] = [];
    const total = chunks.length;

    for (let i = 0; i < chunks.length; i += this.batchSize) {
      const slice = chunks.slice(i, i + this.batchSize);
      const texts = slice.map((c) => {
        const meta = `file: ${c.metadata.file_path} symbol: ${c.metadata.symbol_name} ${c.metadata.symbol_type}\n`;
        return `${meta}${c.content}`;
      });
      const embeddings = await this.embedder.embedBatch(texts, false);

      for (let j = 0; j < slice.length; j++) {
        const chunk = slice[j];
        const emb = embeddings[j];
        documents.push({
          id: chunk.id,
          content: chunk.content,
          embedding: emb,
          metadata: chunk.metadata,
        });
      }

      onProgress?.(Math.min(i + slice.length, total), total);
    }

    return documents;
  }

  /**
   * Vectorizes a single search query text
   */
  public async vectorizeQuery(query: string): Promise<number[]> {
    return this.embedder.embedText(query, true);
  }
}
