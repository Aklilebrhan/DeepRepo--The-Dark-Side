import fs from 'fs';
import path from 'path';
import os from 'os';

export interface CacheOptions {
  cacheDir?: string;
  modelName?: string;
}

export class ModelCacheManager {
  private cacheDir: string;
  private modelName: string;

  constructor(options: CacheOptions = {}) {
    this.modelName = options.modelName || 'nomic-ai/nomic-embed-text-v1.5';
    this.cacheDir =
      options.cacheDir ||
      path.join(os.homedir(), '.deeprepo', 'cache', 'models', this.sanitizeName(this.modelName));
  }

  private sanitizeName(name: string): string {
    return name.replace(/[/\\?%*:|"<>]/g, '_');
  }

  public getCachePath(): string {
    return this.cacheDir;
  }

  public isCached(): boolean {
    if (!fs.existsSync(this.cacheDir)) {
      return false;
    }
    const files = fs.readdirSync(this.cacheDir);
    return files.length > 0;
  }

  public ensureCacheDir(): string {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
    return this.cacheDir;
  }

  public clearCache(): void {
    if (fs.existsSync(this.cacheDir)) {
      fs.rmSync(this.cacheDir, { recursive: true, force: true });
    }
  }
}
