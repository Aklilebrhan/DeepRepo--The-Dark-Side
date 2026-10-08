import { ASTSymbol } from '../types';
import { PromptTemplateEngine } from '../rag/promptTemplate';
import { OllamaClient } from '../llm/ollamaClient';
import { CodeRetriever } from '../rag/retriever';

export interface CodeExplainerOptions {
  llmClient: OllamaClient;
  retriever?: CodeRetriever;
  promptEngine?: PromptTemplateEngine;
}

export interface ExplainCodeParams {
  symbol?: ASTSymbol;
  code: string;
  filePath: string;
  startLine: number;
  endLine: number;
  language: string;
}

export class CodeExplainer {
  private llmClient: OllamaClient;
  private retriever?: CodeRetriever;
  private promptEngine: PromptTemplateEngine;

  constructor(options: CodeExplainerOptions) {
    this.llmClient = options.llmClient;
    this.retriever = options.retriever;
    this.promptEngine = options.promptEngine || new PromptTemplateEngine();
  }

  /**
   * Explains code snippet with cross-file dependency context
   */
  public async explain(params: ExplainCodeParams): Promise<string> {
    let context = 'No external dependencies identified.';
    if (this.retriever) {
      const related = await this.retriever.retrieve(
        `Dependencies for ${params.filePath} lines ${params.startLine}-${params.endLine}`,
        3,
      );
      if (related.length > 0) {
        context = related
          .map((r) => `File ${r.chunk.metadata.file_path}: ${r.chunk.content.slice(0, 300)}...`)
          .join('\n\n');
      }
    }

    const { system, prompt } = this.promptEngine.format('code_explanation', {
      context,
      file_path: params.filePath,
      start_line: params.startLine,
      end_line: params.endLine,
      language: params.language,
      code: params.code,
    });

    return this.llmClient.generate({
      system,
      prompt,
      temperature: 0.2,
    });
  }

  /**
   * Streams explanation in real-time
   */
  public async *streamExplain(params: ExplainCodeParams): AsyncGenerator<string, void, unknown> {
    let context = 'No external dependencies identified.';
    if (this.retriever) {
      const related = await this.retriever.retrieve(
        `Dependencies for ${params.filePath} lines ${params.startLine}-${params.endLine}`,
        3,
      );
      if (related.length > 0) {
        context = related
          .map((r) => `File ${r.chunk.metadata.file_path}: ${r.chunk.content.slice(0, 300)}...`)
          .join('\n\n');
      }
    }

    const { system, prompt } = this.promptEngine.format('code_explanation', {
      context,
      file_path: params.filePath,
      start_line: params.startLine,
      end_line: params.endLine,
      language: params.language,
      code: params.code,
    });

    for await (const token of this.llmClient.streamGenerate({ system, prompt, temperature: 0.2 })) {
      yield token;
    }
  }
}
