import { describe, it, expect } from 'vitest';
import { CodeChunker } from '../src/repo/chunker';
import { ASTSymbol } from '../src/types';

describe('CodeChunker', () => {
  const chunker = new CodeChunker({ chunkTokens: 512, overlapTokens: 50 });

  it('chunks moderate function into ~512 tokens with accurate metadata', () => {
    const symbol: ASTSymbol = {
      name: 'calculateMetrics',
      type: 'function',
      startLine: 15,
      endLine: 40,
      code: `export function calculateMetrics(data: number[]) {\n  return data.reduce((a, b) => a + b, 0);\n}`,
    };

    const chunks = chunker.chunkSymbols([symbol], 'src/analytics.ts', 'typescript', 'hash123');
    expect(chunks).toHaveLength(1);

    const chunk = chunks[0];
    expect(chunk.id).toBe('file:///src/analytics.ts#function_calculateMetrics');
    expect(chunk.metadata.symbol_name).toBe('calculateMetrics');
    expect(chunk.metadata.start_line).toBe(15);
    expect(chunk.metadata.end_line).toBe(40);
    expect(chunk.metadata.file_hash).toBe('hash123');
    expect(chunk.metadata.tokens).toBeGreaterThan(5);
    expect(chunk.metadata.tokens).toBeLessThan(100);
  });

  it('correctly splits large function (>1000 tokens) while preserving overlap', () => {
    // Generate large function body with > 1200 tokens
    const lines = ['export function heavyProcessingTask() {'];
    for (let i = 0; i < 300; i++) {
      lines.push(`  const step_${i} = doComputation("parameter_${i}", ${i * 42});`);
    }
    lines.push('  return true;');
    lines.push('}');

    const largeCode = lines.join('\n');
    const symbol: ASTSymbol = {
      name: 'heavyProcessingTask',
      type: 'function',
      startLine: 1,
      endLine: lines.length,
      code: largeCode,
    };

    const chunks = chunker.chunkSymbols([symbol], 'src/heavy.ts', 'typescript', 'hash999');
    expect(chunks.length).toBeGreaterThan(1);

    // Verify chunk indices and overlap
    for (let i = 0; i < chunks.length; i++) {
      expect(chunks[i].metadata.chunk_index).toBe(i);
      expect(chunks[i].metadata.symbol_name).toBe('heavyProcessingTask');
    }

    // Overlap verification: line ranges overlap between chunk 0 and chunk 1
    expect(chunks[0].metadata.end_line).toBeGreaterThanOrEqual(chunks[1].metadata.start_line);
  });
});
