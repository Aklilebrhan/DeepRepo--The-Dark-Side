import { ASTSymbol, CodeChunk, CodeChunkMetadata } from '../types';
import {
  DEFAULT_CHUNK_SIZE_TOKENS,
  DEFAULT_CHUNK_OVERLAP_TOKENS,
  MAX_CHUNK_TOKENS,
} from '../constants';
import { estimateTokenCount } from '../utils/tokenCounter';

export interface ChunkerOptions {
  chunkTokens?: number;
  overlapTokens?: number;
}

export class CodeChunker {
  private targetTokens: number;
  private overlapTokens: number;

  constructor(options: ChunkerOptions = {}) {
    this.targetTokens = options.chunkTokens ?? DEFAULT_CHUNK_SIZE_TOKENS;
    this.overlapTokens = options.overlapTokens ?? DEFAULT_CHUNK_OVERLAP_TOKENS;
  }

  /**
   * Chunks AST symbols and code into semantic vector-ready chunks
   */
  public chunkSymbols(
    symbols: ASTSymbol[],
    filePath: string,
    language: string,
    fileHash: string,
    dependencies: string[] = [],
    importsFrom: string[] = [],
  ): CodeChunk[] {
    const chunks: CodeChunk[] = [];
    const normalizedPath = filePath.replace(/\\/g, '/');

    for (const symbol of symbols) {
      const codeTokens = estimateTokenCount(symbol.code);

      // If symbol fits well within max limit, keep it as single atomic chunk
      if (codeTokens <= MAX_CHUNK_TOKENS) {
        const metadata: CodeChunkMetadata = {
          file_path: normalizedPath,
          language,
          start_line: symbol.startLine,
          end_line: symbol.endLine,
          symbol_name: symbol.name,
          symbol_type: symbol.type,
          dependencies,
          imports_from: importsFrom,
          file_hash: fileHash,
          chunk_index: 0,
          tokens: codeTokens,
        };

        const id = `file:///${normalizedPath}#${symbol.type}_${symbol.name}`;
        chunks.push({
          id,
          content: symbol.code,
          metadata,
        });
      } else {
        // Very large symbol (>1000 tokens): split into sub-chunks while preserving docstrings & signature
        const subChunks = this.splitLargeSymbol(
          symbol,
          normalizedPath,
          language,
          fileHash,
          dependencies,
          importsFrom,
        );
        chunks.push(...subChunks);
      }
    }

    return chunks;
  }

  /**
   * Splits oversized functions or classes into chunk windows preserving overlap
   */
  private splitLargeSymbol(
    symbol: ASTSymbol,
    filePath: string,
    language: string,
    fileHash: string,
    dependencies: string[],
    importsFrom: string[],
  ): CodeChunk[] {
    const lines = symbol.code.split('\n');
    const chunks: CodeChunk[] = [];
    let startIdx = 0;
    let chunkIndex = 0;

    // Build context header from docstring & signature
    const headerLines = [
      symbol.docstring ? `${symbol.docstring}\n` : '',
      `// Context: ${symbol.type} ${symbol.name} [part of ${symbol.name}]`,
    ]
      .filter(Boolean)
      .join('\n');

    const headerTokens = estimateTokenCount(headerLines);
    const availableTokens = Math.max(100, this.targetTokens - headerTokens);

    while (startIdx < lines.length) {
      let currentTokens = 0;
      let endIdx = startIdx;

      while (endIdx < lines.length) {
        const lineTokens = estimateTokenCount(lines[endIdx]);
        if (currentTokens + lineTokens > availableTokens && endIdx > startIdx) {
          break;
        }
        currentTokens += lineTokens;
        endIdx++;
      }

      const bodySlice = lines.slice(startIdx, endIdx).join('\n');
      const content = `${headerLines}\n${bodySlice}`;
      const totalTokens = estimateTokenCount(content);

      const chunkStartLine = symbol.startLine + startIdx;
      const chunkEndLine = symbol.startLine + endIdx - 1;

      const metadata: CodeChunkMetadata = {
        file_path: filePath,
        language,
        start_line: chunkStartLine,
        end_line: chunkEndLine,
        symbol_name: symbol.name,
        symbol_type: symbol.type,
        dependencies,
        imports_from: importsFrom,
        file_hash: fileHash,
        chunk_index: chunkIndex,
        tokens: totalTokens,
      };

      const id = `file:///${filePath}#${symbol.type}_${symbol.name}_part${chunkIndex}`;
      chunks.push({
        id,
        content,
        metadata,
      });

      if (endIdx >= lines.length) break;

      // Calculate overlap lines backwards
      let overlapCount = 0;
      let overlapLines = 0;
      for (let back = endIdx - 1; back >= startIdx; back--) {
        const lTokens = estimateTokenCount(lines[back]);
        if (overlapCount + lTokens > this.overlapTokens) break;
        overlapCount += lTokens;
        overlapLines++;
      }

      startIdx = Math.max(startIdx + 1, endIdx - overlapLines);
      chunkIndex++;
    }

    return chunks;
  }
}
