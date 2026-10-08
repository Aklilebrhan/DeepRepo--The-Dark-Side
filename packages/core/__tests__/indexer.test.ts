import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Indexer } from '../src/indexing/indexer';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('Indexer Pipeline', () => {
  let testRepoDir: string;

  beforeEach(() => {
    testRepoDir = path.join(os.tmpdir(), `deeprepo-indexer-test-${Date.now()}`);
    fs.mkdirSync(path.join(testRepoDir, 'src'), { recursive: true });

    // Create 5 test files
    for (let i = 1; i <= 5; i++) {
      fs.writeFileSync(
        path.join(testRepoDir, 'src', `module_${i}.ts`),
        `export function executeModule${i}() {\n  return "result ${i}";\n}`,
        'utf-8',
      );
    }
  });

  afterEach(() => {
    if (fs.existsSync(testRepoDir)) {
      fs.rmSync(testRepoDir, { recursive: true, force: true });
    }
  });

  it('indexes a small repo with 5 files and fires progress callbacks with correct counts', async () => {
    const indexer = new Indexer({
      repoPath: testRepoDir,
      inMemoryVectorDB: true,
    });

    const progressPhases: string[] = [];
    const result = await indexer.index((p) => {
      progressPhases.push(p.phase);
    });

    expect(result.filesIndexed).toBe(5);
    expect(result.chunksIndexed).toBe(5);
    expect(indexer.getVectorDB().getCount()).toBe(5);
    expect(progressPhases).toContain('scanning');
    expect(progressPhases).toContain('parsing');
    expect(progressPhases).toContain('embedding');
    expect(progressPhases).toContain('completed');
  });

  it('performs incremental indexing: only re-indexes modified files', async () => {
    const indexer = new Indexer({
      repoPath: testRepoDir,
      inMemoryVectorDB: false, // write state to disk to verify persistence
    });

    // Run 1: initial index
    const res1 = await indexer.index();
    expect(res1.filesIndexed).toBe(5);

    // Run 2: immediately re-index without changes
    const res2 = await indexer.index();
    expect(res2.filesIndexed).toBe(0);
    expect(res2.chunksIndexed).toBe(0);

    // Run 3: modify 1 file
    fs.appendFileSync(
      path.join(testRepoDir, 'src', 'module_1.ts'),
      `\nexport function extraFunction() { return 123; }`,
    );

    const res3 = await indexer.index();
    expect(res3.filesIndexed).toBe(1);
    expect(res3.chunksIndexed).toBe(2); // module_1 now has 2 functions
  });

  it('removes embeddings and state when a file is deleted', async () => {
    const indexer = new Indexer({
      repoPath: testRepoDir,
      inMemoryVectorDB: false,
    });

    await indexer.index();
    expect(indexer.getVectorDB().getCount()).toBe(5);

    // Delete 1 file
    const fileToDelete = path.join(testRepoDir, 'src', 'module_5.ts');
    fs.unlinkSync(fileToDelete);

    const res = await indexer.index();
    expect(res.filesDeleted).toBe(1);
    expect(indexer.getVectorDB().getCount()).toBe(4);
  });
});
