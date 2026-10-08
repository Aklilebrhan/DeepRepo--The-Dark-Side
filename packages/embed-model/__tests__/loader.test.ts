import { describe, it, expect, afterEach } from 'vitest';
import { ModelCacheManager, ModelLoader, CodeEmbedder } from '../src';
import path from 'path';
import os from 'os';
import fs from 'fs';

describe('ModelCacheManager', () => {
  const tempDir = path.join(os.tmpdir(), `deeprepo-cache-test-${Date.now()}`);

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('correctly creates cache path and checks existence', () => {
    const cacheManager = new ModelCacheManager({
      modelName: 'nomic-ai/nomic-embed-text-v1.5',
      cacheDir: tempDir,
    });

    expect(cacheManager.getCachePath()).toBe(tempDir);
    expect(cacheManager.isCached()).toBe(false);

    cacheManager.ensureCacheDir();
    expect(fs.existsSync(tempDir)).toBe(true);

    fs.writeFileSync(path.join(tempDir, 'model.onnx'), 'mock');
    expect(cacheManager.isCached()).toBe(true);

    cacheManager.clearCache();
    expect(fs.existsSync(tempDir)).toBe(false);
  });
});

describe('ModelLoader & CodeEmbedder', () => {
  it('instantiates ModelLoader with default nomic model', () => {
    const loader = new ModelLoader();
    expect(loader.getModelName()).toBe('nomic-ai/nomic-embed-text-v1.5');
  });

  it('generates 384-dimensional deterministic embeddings', async () => {
    const embedder = new CodeEmbedder({ batchSize: 2 });
    const vector = await embedder.embedText('export function authenticate() {}', false);

    expect(vector).toHaveLength(384);
    expect(typeof vector[0]).toBe('number');

    // Batch embedding
    const batch = await embedder.embedBatch([
      'export function login() {}',
      'export function logout() {}',
      'export class UserService {}',
    ]);

    expect(batch).toHaveLength(3);
    expect(batch[0]).toHaveLength(384);
    expect(batch[1]).toHaveLength(384);
    expect(batch[2]).toHaveLength(384);
  });

  it('supports pipeline mock injection', async () => {
    const loader = new ModelLoader();
    const mockOutput = {
      data: new Float32Array(384).fill(0.42),
    };
    loader.setPipelineMock(async () => mockOutput);

    const pipeline = await loader.loadPipeline();
    const res = await pipeline(['test input']);
    expect(res.data).toBeDefined();
    expect(res.data[0]).toBeCloseTo(0.42);
  });
});
