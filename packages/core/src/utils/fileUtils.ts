import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { EXTENSION_TO_LANGUAGE_MAP, DEFAULT_EXCLUDED_DIRS, SupportedLanguage } from '../constants';

export function computeFileHash(content: string | Buffer): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function computeFileHashFromDisk(filePath: string): string {
  const buffer = fs.readFileSync(filePath);
  return computeFileHash(buffer);
}

export function detectLanguage(filePath: string): SupportedLanguage | null {
  const ext = path.extname(filePath).toLowerCase();
  return EXTENSION_TO_LANGUAGE_MAP[ext] || null;
}

export interface ScanOptions {
  excludedDirs?: string[];
  maxFileSizeKb?: number;
}

export function scanRepositoryFiles(repoPath: string, options: ScanOptions = {}): string[] {
  const excluded = new Set(options.excludedDirs || DEFAULT_EXCLUDED_DIRS);
  const maxBytes = (options.maxFileSizeKb ?? 500) * 1024;
  const result: string[] = [];

  function walk(currentDir: string) {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (!excluded.has(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        if (entry.name.endsWith('.d.ts') || entry.name.endsWith('.map')) {
          continue;
        }
        const lang = detectLanguage(entry.name);
        if (lang) {
          try {
            const stat = fs.statSync(fullPath);
            if (stat.size <= maxBytes) {
              result.push(fullPath);
            }
          } catch {
            // Ignore inaccessible file
          }
        }
      }
    }
  }

  walk(path.resolve(repoPath));
  return result;
}
