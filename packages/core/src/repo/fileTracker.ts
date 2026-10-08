import fs from 'fs';
import path from 'path';
import { RepoFileRecord, ChunkRecord } from '../types';
import { computeFileHashFromDisk, detectLanguage } from '../utils/fileUtils';

export interface FileChangeDiff {
  added: string[];
  modified: string[];
  deleted: string[];
  unchanged: string[];
}

export class FileTracker {
  private dbPath: string;
  private files: Map<string, RepoFileRecord> = new Map();
  private chunks: Map<string, ChunkRecord> = new Map();

  constructor(storageDir: string) {
    this.dbPath = path.join(storageDir, 'state.json');
    this.loadState();
  }

  public loadState(): void {
    if (fs.existsSync(this.dbPath)) {
      try {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        const data = JSON.parse(raw);
        if (data.files && Array.isArray(data.files)) {
          this.files.clear();
          for (const f of data.files) {
            this.files.set(f.file_path, f);
          }
        }
        if (data.chunks && Array.isArray(data.chunks)) {
          this.chunks.clear();
          for (const c of data.chunks) {
            this.chunks.set(c.id, c);
          }
        }
      } catch {
        // Fallback to empty map
      }
    }
  }

  public saveState(): void {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const data = {
      files: Array.from(this.files.values()),
      chunks: Array.from(this.chunks.values()),
      updated_at: new Date().toISOString(),
    };
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  public getFileRecord(filePath: string): RepoFileRecord | undefined {
    return this.files.get(filePath);
  }

  public setFileRecord(record: RepoFileRecord): void {
    this.files.set(record.file_path, record);
  }

  public removeFileRecord(filePath: string): void {
    this.files.delete(filePath);
    // Also remove associated chunks
    for (const [id, c] of this.chunks.entries()) {
      if (c.file_path === filePath) {
        this.chunks.delete(id);
      }
    }
  }

  public setChunkRecord(chunk: ChunkRecord): void {
    this.chunks.set(chunk.id, chunk);
  }

  public getChunksForFile(filePath: string): ChunkRecord[] {
    const list: ChunkRecord[] = [];
    for (const c of this.chunks.values()) {
      if (c.file_path === filePath) {
        list.push(c);
      }
    }
    return list;
  }

  public getAllFiles(): RepoFileRecord[] {
    return Array.from(this.files.values());
  }

  /**
   * Compares scanned files against stored state to detect changes
   */
  public detectChanges(scannedFilePaths: string[]): FileChangeDiff {
    const added: string[] = [];
    const modified: string[] = [];
    const unchanged: string[] = [];
    const scannedSet = new Set(scannedFilePaths);

    for (const filePath of scannedFilePaths) {
      const stored = this.files.get(filePath);
      if (!stored) {
        added.push(filePath);
      } else {
        try {
          const currentHash = computeFileHashFromDisk(filePath);
          if (currentHash !== stored.file_hash) {
            modified.push(filePath);
          } else {
            unchanged.push(filePath);
          }
        } catch {
          modified.push(filePath);
        }
      }
    }

    const deleted: string[] = [];
    for (const storedPath of this.files.keys()) {
      if (!scannedSet.has(storedPath)) {
        deleted.push(storedPath);
      }
    }

    return { added, modified, deleted, unchanged };
  }

  public recordFileIndexed(filePath: string, hash: string): void {
    const lang = detectLanguage(filePath) || 'unknown';
    this.setFileRecord({
      file_path: filePath,
      language: lang,
      file_hash: hash,
      last_indexed: new Date().toISOString(),
      status: 'indexed',
    });
  }
}
