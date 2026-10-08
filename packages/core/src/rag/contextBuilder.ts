import { SearchResult } from '../types';
import { MAX_CONTEXT_TOKENS, MAX_HISTORY_MESSAGES } from '../constants';
import { estimateTokenCount } from '../utils/tokenCounter';

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ContextAssembleResult {
  formattedContext: string;
  totalTokens: number;
  chunksIncluded: number;
  trimmedHistory: ChatHistoryMessage[];
}

export class ContextBuilder {
  private maxContextTokens: number;
  private maxHistoryMessages: number;

  constructor(options: { maxContextTokens?: number; maxHistoryMessages?: number } = {}) {
    this.maxContextTokens = options.maxContextTokens || MAX_CONTEXT_TOKENS;
    this.maxHistoryMessages = options.maxHistoryMessages || MAX_HISTORY_MESSAGES;
  }

  /**
   * Formats top-k retrieved search results into a clean markdown context string
   */
  public formatRetrievedChunks(results: SearchResult[]): {
    context: string;
    tokens: number;
    count: number;
  } {
    let context = '';
    let currentTokens = 0;
    let count = 0;

    for (let i = 0; i < results.length; i++) {
      const { chunk } = results[i];
      const m = chunk.metadata;
      const snippet = [
        `--- Chunk ${i + 1} ---`,
        `File: ${m.file_path} (Lines ${m.start_line}-${m.end_line})`,
        `Symbol: ${m.symbol_name} (${m.symbol_type}) [Language: ${m.language}]`,
        '```' + m.language,
        chunk.content,
        '```',
        '',
      ].join('\n');

      const snippetTokens = estimateTokenCount(snippet);
      if (currentTokens + snippetTokens > this.maxContextTokens && count > 0) {
        // Try truncating if it's the only chunk or stop
        break;
      }

      context += snippet + '\n';
      currentTokens += snippetTokens;
      count++;
    }

    return { context: context.trim(), tokens: currentTokens, count };
  }

  /**
   * Assembles full RAG context window with query, top chunks, and pruned conversation history
   */
  public assemble(
    query: string,
    searchResults: SearchResult[],
    history: ChatHistoryMessage[] = [],
  ): ContextAssembleResult {
    const { context, tokens: chunkTokens, count } = this.formatRetrievedChunks(searchResults);

    // Prune history to last N messages
    const trimmedHistory = history.slice(-this.maxHistoryMessages);

    // Ensure total context does not exceed limits
    const queryTokens = estimateTokenCount(query);
    const totalTokens = chunkTokens + queryTokens;

    return {
      formattedContext: context,
      totalTokens,
      chunksIncluded: count,
      trimmedHistory,
    };
  }
}
