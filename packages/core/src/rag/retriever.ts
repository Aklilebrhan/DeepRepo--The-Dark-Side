import { VectorDB } from '../indexing/vectorDB';
import { EmbeddingPipeline } from '../indexing/embeddingPipeline';
import { SearchResult } from '../types';
import { MAX_RETRIEVAL_CHUNKS } from '../constants';

export interface RetrieverOptions {
  vectorDB: VectorDB;
  embeddingPipeline: EmbeddingPipeline;
  defaultLimit?: number;
}

export class CodeRetriever {
  private vectorDB: VectorDB;
  private embeddingPipeline: EmbeddingPipeline;
  private defaultLimit: number;

  constructor(options: RetrieverOptions) {
    this.vectorDB = options.vectorDB;
    this.embeddingPipeline = options.embeddingPipeline;
    this.defaultLimit = options.defaultLimit || MAX_RETRIEVAL_CHUNKS;
  }

  /**
   * Retrieves top-k semantic code chunks for a natural language or code query
   */
  public async retrieve(
    query: string,
    limit: number = this.defaultLimit,
    filter?: Record<string, any>,
  ): Promise<SearchResult[]> {
    const queryEmbedding = await this.embeddingPipeline.vectorizeQuery(query);
    const results = await this.vectorDB.search(queryEmbedding, limit, filter);
    return results;
  }
}
