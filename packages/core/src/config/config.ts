import fs from 'fs';
import path from 'path';
import { RepoConfig } from '../types';
import {
  DEFAULT_CONFIG_DIR,
  ALT_CONFIG_DIR,
  CONFIG_FILE_NAME,
  DEFAULT_LLM_MODEL,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_CHUNK_SIZE_TOKENS,
  DEFAULT_CHUNK_OVERLAP_TOKENS,
  DEFAULT_EXCLUDED_DIRS,
  SUPPORTED_LANGUAGES,
} from '../constants';

export class ConfigManager {
  private repoPath: string;
  private configDir: string;
  private configFilePath: string;

  constructor(repoPath: string) {
    this.repoPath = path.resolve(repoPath);
    // Check if .gitmind exists, otherwise use .deeprepo
    const altDir = path.join(this.repoPath, ALT_CONFIG_DIR);
    if (fs.existsSync(altDir)) {
      this.configDir = altDir;
    } else {
      this.configDir = path.join(this.repoPath, DEFAULT_CONFIG_DIR);
    }
    this.configFilePath = path.join(this.configDir, CONFIG_FILE_NAME);
  }

  public getConfigDir(): string {
    return this.configDir;
  }

  public ensureConfigDir(): string {
    if (!fs.existsSync(this.configDir)) {
      fs.mkdirSync(this.configDir, { recursive: true });
    }
    return this.configDir;
  }

  public getDefaultConfig(): RepoConfig {
    return {
      repo_path: this.repoPath,
      indexed_at: new Date().toISOString(),
      llm_model: DEFAULT_LLM_MODEL,
      embed_model: DEFAULT_EMBEDDING_MODEL,
      chunk_tokens: DEFAULT_CHUNK_SIZE_TOKENS,
      overlap_tokens: DEFAULT_CHUNK_OVERLAP_TOKENS,
      excluded_dirs: [...DEFAULT_EXCLUDED_DIRS],
      languages: [...SUPPORTED_LANGUAGES],
    };
  }

  public loadConfig(): RepoConfig {
    if (!fs.existsSync(this.configFilePath)) {
      return this.getDefaultConfig();
    }
    try {
      const raw = fs.readFileSync(this.configFilePath, 'utf-8');
      return { ...this.getDefaultConfig(), ...JSON.parse(raw) };
    } catch {
      return this.getDefaultConfig();
    }
  }

  public saveConfig(config: Partial<RepoConfig>): RepoConfig {
    this.ensureConfigDir();
    const current = this.loadConfig();
    const updated: RepoConfig = {
      ...current,
      ...config,
      repo_path: this.repoPath,
      indexed_at: new Date().toISOString(),
    };
    fs.writeFileSync(this.configFilePath, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  }
}
