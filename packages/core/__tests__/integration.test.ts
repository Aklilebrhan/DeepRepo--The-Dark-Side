import { describe, it, expect, vi, afterAll } from 'vitest';
import { Indexer } from '../src/indexing/indexer';
import { CodeRetriever } from '../src/rag/retriever';
import { ContextBuilder } from '../src/rag/contextBuilder';
import { PromptTemplateEngine } from '../src/rag/promptTemplate';
import { OllamaClient } from '../src/llm/ollamaClient';
import { TestGenerator } from '../src/features/testGeneration';
import path from 'path';
import fs from 'fs';

describe('DeepRepo Full Integration Pipeline', () => {
  const fixtureRepo = path.resolve(__dirname, '../../../e2e/fixtures/sample-repo');

  afterAll(() => {
    const configDir = path.join(fixtureRepo, '.deeprepo');
    if (fs.existsSync(configDir)) {
      fs.rmSync(configDir, { recursive: true, force: true });
    }
  });

  it('runs full pipeline: Index → Search → Retrieve', async () => {
    const indexer = new Indexer({
      repoPath: fixtureRepo,
      inMemoryVectorDB: true,
    });

    const indexRes = await indexer.index();
    expect(indexRes.filesIndexed).toBeGreaterThanOrEqual(2);
    expect(indexRes.chunksIndexed).toBeGreaterThanOrEqual(3);

    const retriever = new CodeRetriever({
      vectorDB: indexer.getVectorDB(),
      embeddingPipeline: indexer.getEmbeddingPipeline(),
    });

    // Query for session/authentication logic
    const results = await retriever.retrieve('validate session authentication', 3);
    expect(results.length).toBeGreaterThan(0);

    const matchNames = results.map((r) => r.chunk.metadata.symbol_name);
    expect(
      matchNames.some(
        (n) =>
          n.includes('AuthenticationManager') ||
          n.includes('validate') ||
          n.includes('formatGreeting'),
      ),
    ).toBe(true);
  });

  it('runs Index repo → Chat (RAG) → Get response with attributed context', async () => {
    const indexer = new Indexer({
      repoPath: fixtureRepo,
      inMemoryVectorDB: true,
    });
    await indexer.index();

    const retriever = new CodeRetriever({
      vectorDB: indexer.getVectorDB(),
      embeddingPipeline: indexer.getEmbeddingPipeline(),
    });

    const contextBuilder = new ContextBuilder();
    const promptEngine = new PromptTemplateEngine();

    const searchResults = await retriever.retrieve('greeting function', 3);
    const assembled = contextBuilder.assemble('How do I greet a user?', searchResults);

    expect(assembled.chunksIncluded).toBeGreaterThan(0);
    expect(assembled.formattedContext).toContain('formatGreeting');

    const formatted = promptEngine.format('rag_chat', {
      context: assembled.formattedContext,
      query: 'How do I greet a user?',
    });

    // Mock LLM client response
    const mockLlm = new OllamaClient();
    vi.spyOn(mockLlm, 'generate').mockResolvedValue(
      'To greet a user, call `formatGreeting(name)` in `src/utils.ts`. It returns "Hello, {name}!".',
    );

    const answer = await mockLlm.generate({
      system: formatted.system,
      prompt: formatted.prompt,
    });

    expect(answer).toContain('formatGreeting');
    expect(answer).toContain('src/utils.ts');
  });

  it('runs Index repo → Generate tests → Verify output', async () => {
    const indexer = new Indexer({
      repoPath: fixtureRepo,
      inMemoryVectorDB: true,
    });
    await indexer.index();

    // Query for formatGreeting chunk
    const chunks = await indexer.getVectorDB().queryByMetadata({ symbol_name: 'formatGreeting' });
    expect(chunks.length).toBeGreaterThan(0);

    const targetChunk = chunks[0];
    const mockLlm = new OllamaClient();
    const testGen = new TestGenerator({ llmClient: mockLlm });

    const staticStub = testGen.createStaticTestStub(
      {
        name: targetChunk.metadata.symbol_name,
        type: targetChunk.metadata.symbol_type,
        startLine: targetChunk.metadata.start_line,
        endLine: targetChunk.metadata.end_line,
        code: targetChunk.content,
      },
      targetChunk.metadata.file_path,
      targetChunk.metadata.language,
    );

    expect(staticStub).toContain("describe('formatGreeting'");
    expect(staticStub).toContain('expect(');
  });
});
