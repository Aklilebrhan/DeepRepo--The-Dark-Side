import { describe, it, expect, beforeEach } from 'vitest';
import { VectorDB } from '../src/indexing/vectorDB';
import { EmbeddingPipeline } from '../src/indexing/embeddingPipeline';
import { CodeRetriever } from '../src/rag/retriever';
import { PromptTemplateEngine } from '../src/rag/promptTemplate';
import { ContextBuilder } from '../src/rag/contextBuilder';
import { VectorDocument } from '../src/types';

describe('RAG Pipeline', () => {
  let vectorDB: VectorDB;
  let pipeline: EmbeddingPipeline;
  let retriever: CodeRetriever;
  let promptEngine: PromptTemplateEngine;
  let contextBuilder: ContextBuilder;

  beforeEach(async () => {
    vectorDB = new VectorDB({ inMemory: true });
    pipeline = new EmbeddingPipeline();
    retriever = new CodeRetriever({ vectorDB, embeddingPipeline: pipeline });
    promptEngine = new PromptTemplateEngine();
    contextBuilder = new ContextBuilder({ maxContextTokens: 1500, maxHistoryMessages: 5 });

    // Seed mock vector documents
    const docs: VectorDocument[] = [];
    for (let i = 1; i <= 8; i++) {
      const code = `export function feature_${i}() { return 'feature ${i} implementation'; }`;
      const emb = await pipeline.vectorizeQuery(`feature ${i}`);
      docs.push({
        id: `chunk_${i}`,
        content: code,
        embedding: emb,
        metadata: {
          file_path: `src/feature_${i}.ts`,
          language: 'typescript',
          start_line: 1,
          end_line: 5,
          symbol_name: `feature_${i}`,
          symbol_type: 'function',
          dependencies: [],
          imports_from: [],
          file_hash: `hash_${i}`,
          chunk_index: 0,
          tokens: 25,
        },
      });
    }
    await vectorDB.addDocuments(docs);
  });

  it('retrieves top-5 chunks for a query', async () => {
    const results = await retriever.retrieve('feature 3', 5);
    expect(results).toHaveLength(5);
    expect(results[0].chunk.metadata.symbol_name).toBe('feature_3');
  });

  it('assembles prompt correctly with system, chunks, and query', async () => {
    const searchResults = await retriever.retrieve('feature 2', 3);
    const assembled = contextBuilder.assemble('How does feature 2 work?', searchResults, [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ]);

    expect(assembled.chunksIncluded).toBe(3);
    expect(assembled.formattedContext).toContain('feature_2');
    expect(assembled.trimmedHistory).toHaveLength(2);

    const formatted = promptEngine.format('rag_chat', {
      context: assembled.formattedContext,
      query: 'How does feature 2 work?',
    });

    expect(formatted.system).toContain('DeepRepo');
    expect(formatted.prompt).toContain('feature_2');
    expect(formatted.prompt).toContain('How does feature 2 work?');
  });

  it('token count stays strictly under context limit', async () => {
    const results = await retriever.retrieve('feature', 5);
    const assembled = contextBuilder.assemble('What are all features?', results);
    expect(assembled.totalTokens).toBeLessThanOrEqual(2000);
  });
});
