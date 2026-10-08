import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GitHandler } from '../src/repo/gitHandler';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('GitHandler', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), `deeprepo-git-test-${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('detects git repository existence and fallbacks', async () => {
    const handler = new GitHandler(tempDir);
    expect(await handler.isGitRepo()).toBe(false);
    expect(await handler.getCurrentBranch()).toBe('main');
    expect(await handler.listTrackedFiles()).toEqual([]);
    expect(await handler.getLatestCommit()).toBeNull();

    // Create .git folder
    fs.mkdirSync(path.join(tempDir, '.git'));
    expect(await handler.isGitRepo()).toBe(true);
  });
});
