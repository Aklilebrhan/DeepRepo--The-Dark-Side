import path from 'path';
import fs from 'fs';
import { ConfigManager } from '../config/config';
import { FileTracker } from '../repo/fileTracker';
import { CodeParser } from '../repo/parser';
import { CodeChunker } from '../repo/chunker';
import { VectorDB } from './vectorDB';
import { EmbeddingPipeline } from './embeddingPipeline';
import { IndexProgress, CodeChunk } from '../types';
import { scanRepositoryFiles, computeFileHashFromDisk, detectLanguage } from '../utils/fileUtils';
import { createLogger } from '../config/logger';

export interface IndexerOptions {
  repoPath: string;
  inMemoryVectorDB?: boolean;
  batchSize?: number;
}

export class Indexer {
  private repoPath: string;
  private configManager: ConfigManager;
  private fileTracker: FileTracker;
  private parser: CodeParser;
  private chunker: CodeChunker;
  private vectorDB: VectorDB;
  private embeddingPipeline: EmbeddingPipeline;
  private logger: any;

  constructor(options: IndexerOptions) {
    this.repoPath = path.resolve(options.repoPath);
    this.configManager = new ConfigManager(this.repoPath);
    const configDir = this.configManager.ensureConfigDir();

    const logDir = path.join(configDir, 'logs');
    this.logger = createLogger({ logDir, service: 'indexer' });

    this.fileTracker = new FileTracker(configDir);
    this.parser = new CodeParser();
    this.chunker = new CodeChunker();

    const chromaDir = path.join(configDir, 'chroma');
    this.vectorDB = new VectorDB({
      storageDir: chromaDir,
      inMemory: options.inMemoryVectorDB ?? false,
    });

    this.embeddingPipeline = new EmbeddingPipeline({
      batchSize: options.batchSize || 64,
      cacheDir: path.join(configDir, 'cache', 'models'),
    });
  }

  public getVectorDB(): VectorDB {
    return this.vectorDB;
  }

  public getFileTracker(): FileTracker {
    return this.fileTracker;
  }

  public getConfigManager(): ConfigManager {
    return this.configManager;
  }

  public getEmbeddingPipeline(): EmbeddingPipeline {
    return this.embeddingPipeline;
  }

  /**
   * Runs indexing (full or incremental)
   */
  public async index(
    onProgress?: (progress: IndexProgress) => void,
  ): Promise<{ filesIndexed: number; chunksIndexed: number; filesDeleted: number }> {
    const config = this.configManager.loadConfig();

    // Phase 1: Scanning files
    onProgress?.({
      phase: 'scanning',
      filesScanned: 0,
      totalFiles: 0,
      chunksCreated: 0,
      embeddingsDone: 0,
      totalChunks: 0,
    });

    const scannedFiles = scanRepositoryFiles(this.repoPath, {
      excludedDirs: config.excluded_dirs,
    });

    this.logger.info(`Scanned ${scannedFiles.length} eligible files in repository`);

    // Detect diff (incremental comparison)
    const diff = this.fileTracker.detectChanges(scannedFiles);
    this.logger.info(
      `Change detection: added=${diff.added.length}, modified=${diff.modified.length}, deleted=${diff.deleted.length}, unchanged=${diff.unchanged.length}`,
    );

    // Handle deleted files
    let deletedCount = 0;
    for (const deletedFile of diff.deleted) {
      await this.vectorDB.deleteByFilePath(deletedFile);
      this.fileTracker.removeFileRecord(deletedFile);
      deletedCount++;
    }

    let filesToProcess = [...diff.added, ...diff.modified];
    if (this.vectorDB.getCount() === 0 && filesToProcess.length === 0) {
      filesToProcess = [...scannedFiles];
    }
    const totalFiles = scannedFiles.length;

    if (filesToProcess.length === 0) {
      onProgress?.({
        phase: 'completed',
        filesScanned: totalFiles,
        totalFiles,
        chunksCreated: 0,
        embeddingsDone: 0,
        totalChunks: 0,
      });
      this.fileTracker.saveState();
      return { filesIndexed: 0, chunksIndexed: 0, filesDeleted: deletedCount };
    }

    // Phase 2: Parsing & Chunking
    const allNewChunks: CodeChunk[] = [];
    let filesProcessedCount = 0;

    for (const filePath of filesToProcess) {
      filesProcessedCount++;
      const relPath = path.relative(this.repoPath, filePath).replace(/\\/g, '/');

      onProgress?.({
        phase: 'parsing',
        filesScanned: filesProcessedCount,
        totalFiles: filesToProcess.length,
        chunksCreated: allNewChunks.length,
        embeddingsDone: 0,
        totalChunks: 0,
        currentFile: relPath,
      });

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const hash = computeFileHashFromDisk(filePath);
        const language = detectLanguage(filePath) || 'typescript';

        // Purge old chunks for modified file before re-indexing
        if (diff.modified.includes(filePath)) {
          await this.vectorDB.deleteByFilePath(filePath);
        }

        const parseResult = this.parser.parse(content, language, relPath);
        const chunks = this.chunker.chunkSymbols(
          parseResult.symbols,
          relPath,
          language,
          hash,
          parseResult.dependencies,
          parseResult.imports,
        );

        allNewChunks.push(...chunks);
        this.fileTracker.recordFileIndexed(filePath, hash);

        for (const chunk of chunks) {
          this.fileTracker.setChunkRecord({
            id: chunk.id,
            file_path: filePath,
            start_line: chunk.metadata.start_line,
            end_line: chunk.metadata.end_line,
            symbol_name: chunk.metadata.symbol_name,
            is_synced: 1,
          });
        }
      } catch (err: any) {
        this.logger.error(`Error processing file ${filePath}: ${err.message}`);
      }
    }

    // Phase 3: Embedding & Storing
    onProgress?.({
      phase: 'embedding',
      filesScanned: filesToProcess.length,
      totalFiles: filesToProcess.length,
      chunksCreated: allNewChunks.length,
      embeddingsDone: 0,
      totalChunks: allNewChunks.length,
    });

    const vectorDocuments = await this.embeddingPipeline.vectorizeChunks(
      allNewChunks,
      (done, total) => {
        onProgress?.({
          phase: 'embedding',
          filesScanned: filesToProcess.length,
          totalFiles: filesToProcess.length,
          chunksCreated: allNewChunks.length,
          embeddingsDone: done,
          totalChunks: total,
        });
      },
    );

    onProgress?.({
      phase: 'storing',
      filesScanned: filesToProcess.length,
      totalFiles: filesToProcess.length,
      chunksCreated: allNewChunks.length,
      embeddingsDone: vectorDocuments.length,
      totalChunks: vectorDocuments.length,
    });

    await this.vectorDB.addDocuments(vectorDocuments);

    // Save final tracker state & repo config
    this.fileTracker.saveState();
    this.configManager.saveConfig({ indexed_at: new Date().toISOString() });

    onProgress?.({
      phase: 'completed',
      filesScanned: totalFiles,
      totalFiles,
      chunksCreated: allNewChunks.length,
      embeddingsDone: vectorDocuments.length,
      totalChunks: vectorDocuments.length,
    });

    return {
      filesIndexed: filesToProcess.length,
      chunksIndexed: vectorDocuments.length,
      filesDeleted: deletedCount,
    };
  }
}
