import fs from 'fs';
import path from 'path';
import { VectorDocument, SearchResult, CodeChunk } from '../types';
import { CHROMA_COLLECTION_NAME } from '../constants';

export interface VectorDBOptions {
  storageDir?: string;
  collectionName?: string;
  inMemory?: boolean;
}

export class VectorDB {
  private collectionName: string;
  private storageDir: string;
  private inMemory: boolean;
  private documents: Map<string, VectorDocument> = new Map();

  constructor(options: VectorDBOptions = {}) {
    this.collectionName = options.collectionName || CHROMA_COLLECTION_NAME;
    this.inMemory = options.inMemory ?? false;
    this.storageDir = options.storageDir || '';

    if (!this.inMemory && this.storageDir) {
      this.loadFromDisk();
    }
  }

  public getCollectionName(): string {
    return this.collectionName;
  }

  public getCount(): number {
    return this.documents.size;
  }

  /**
   * Add or update vector documents in the collection
   */
  public async addDocuments(docs: VectorDocument[]): Promise<void> {
    for (const doc of docs) {
      this.documents.set(doc.id, doc);
    }
    if (!this.inMemory && this.storageDir) {
      this.saveToDisk();
    }
  }

  /**
   * Search for top-k similar documents by embedding vector
   */
  public async search(
    queryEmbedding: number[],
    limit = 5,
    filter?: Record<string, any>,
  ): Promise<SearchResult[]> {
    const candidates: SearchResult[] = [];

    for (const doc of this.documents.values()) {
      // Apply metadata filter if provided
      if (filter && !this.matchesFilter(doc.metadata, filter)) {
        continue;
      }

      const sim = this.cosineSimilarity(queryEmbedding, doc.embedding);
      candidates.push({
        chunk: {
          id: doc.id,
          content: doc.content,
          metadata: doc.metadata,
          embedding: doc.embedding,
        },
        score: sim,
        distance: 1 - sim,
      });
    }

    // Sort descending by similarity score
    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, limit);
  }

  /**
   * Delete documents by ID
   */
  public async delete(ids: string[]): Promise<void> {
    for (const id of ids) {
      this.documents.delete(id);
    }
    if (!this.inMemory && this.storageDir) {
      this.saveToDisk();
    }
  }

  /**
   * Delete documents by file path
   */
  public async deleteByFilePath(filePath: string): Promise<number> {
    const normalized = filePath.replace(/\\/g, '/');
    const toDelete: string[] = [];

    for (const [id, doc] of this.documents.entries()) {
      const docPath = doc.metadata.file_path.replace(/\\/g, '/');
      if (docPath === normalized || docPath.endsWith(normalized) || normalized.endsWith(docPath)) {
        toDelete.push(id);
      }
    }

    for (const id of toDelete) {
      this.documents.delete(id);
    }

    if (!this.inMemory && this.storageDir) {
      this.saveToDisk();
    }
    return toDelete.length;
  }

  /**
   * Query documents matching a metadata filter
   */
  public async queryByMetadata(filter: Record<string, any>): Promise<CodeChunk[]> {
    const results: CodeChunk[] = [];
    for (const doc of this.documents.values()) {
      if (this.matchesFilter(doc.metadata, filter)) {
        results.push({
          id: doc.id,
          content: doc.content,
          metadata: doc.metadata,
          embedding: doc.embedding,
        });
      }
    }
    return results;
  }

  /**
   * Resets the entire collection
   */
  public async reset(): Promise<void> {
    this.documents.clear();
    if (!this.inMemory && this.storageDir && fs.existsSync(this.storageDir)) {
      const docsFile = path.join(this.storageDir, 'documents.json');
      const metaFile = path.join(this.storageDir, 'metadatas.json');
      const embFile = path.join(this.storageDir, 'embeddings.bin');
      if (fs.existsSync(docsFile)) fs.unlinkSync(docsFile);
      if (fs.existsSync(metaFile)) fs.unlinkSync(metaFile);
      if (fs.existsSync(embFile)) fs.unlinkSync(embFile);
    }
  }

  private matchesFilter(metadata: Record<string, any>, filter: Record<string, any>): boolean {
    for (const [k, v] of Object.entries(filter)) {
      if (metadata[k] !== v) {
        return false;
      }
    }
    return true;
  }

  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private loadFromDisk(): void {
    try {
      const docsFile = path.join(this.storageDir, 'documents.json');
      if (fs.existsSync(docsFile)) {
        const raw = fs.readFileSync(docsFile, 'utf-8');
        const docsArray: VectorDocument[] = JSON.parse(raw);
        for (const doc of docsArray) {
          this.documents.set(doc.id, doc);
        }
      }
    } catch {
      // Fallback
    }
  }

  private saveToDisk(): void {
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }
      const docsFile = path.join(this.storageDir, 'documents.json');
      const metaFile = path.join(this.storageDir, 'metadatas.json');
      const docsArray = Array.from(this.documents.values());

      fs.writeFileSync(docsFile, JSON.stringify(docsArray, null, 2), 'utf-8');

      const metadatas = docsArray.map((d) => ({ id: d.id, metadata: d.metadata }));
      fs.writeFileSync(metaFile, JSON.stringify(metadatas, null, 2), 'utf-8');
    } catch {
      // Fallback
    }
  }
}
