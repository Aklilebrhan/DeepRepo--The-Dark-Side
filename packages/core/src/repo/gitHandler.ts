import git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';

export class GitHandler {
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = path.resolve(repoPath);
  }

  public async isGitRepo(): Promise<boolean> {
    try {
      const gitDir = path.join(this.repoPath, '.git');
      return fs.existsSync(gitDir);
    } catch {
      return false;
    }
  }

  public async getCurrentBranch(): Promise<string> {
    try {
      const branch = await git.currentBranch({
        fs,
        dir: this.repoPath,
        fullname: false,
      });
      return branch || 'main';
    } catch {
      return 'main';
    }
  }

  public async listTrackedFiles(): Promise<string[]> {
    try {
      const files = await git.listFiles({
        fs,
        dir: this.repoPath,
      });
      return files.map((f) => path.join(this.repoPath, f));
    } catch {
      return [];
    }
  }

  public async getLatestCommit(): Promise<{ oid: string; message: string; author: string } | null> {
    try {
      const commits = await git.log({
        fs,
        dir: this.repoPath,
        depth: 1,
      });
      if (commits.length > 0) {
        const c = commits[0];
        return {
          oid: c.oid,
          message: c.commit.message,
          author: c.commit.author.name,
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}
