import { ASTSymbol } from '../types';
import { PromptTemplateEngine } from '../rag/promptTemplate';
import { OllamaClient } from '../llm/ollamaClient';

export interface TestGeneratorOptions {
  llmClient: OllamaClient;
  promptEngine?: PromptTemplateEngine;
}

export interface GenerateTestParams {
  symbol: ASTSymbol;
  filePath: string;
  language: string;
  testFramework?: string;
  stream?: boolean;
}

export class TestGenerator {
  private llmClient: OllamaClient;
  private promptEngine: PromptTemplateEngine;

  constructor(options: TestGeneratorOptions) {
    this.llmClient = options.llmClient;
    this.promptEngine = options.promptEngine || new PromptTemplateEngine();
  }

  /**
   * Determine idiomatic test framework based on language
   */
  public getDefaultTestFramework(language: string): string {
    switch (language.toLowerCase()) {
      case 'typescript':
      case 'javascript':
        return 'Vitest / Jest';
      case 'python':
        return 'unittest / pytest';
      case 'go':
        return 'testing package (go test)';
      case 'java':
        return 'JUnit 5';
      default:
        return 'standard unit testing framework';
    }
  }

  /**
   * Builds prompt and generates complete unit test suite for an AST symbol
   */
  public async generateTests(params: GenerateTestParams): Promise<string> {
    const framework = params.testFramework || this.getDefaultTestFramework(params.language);
    const { system, prompt } = this.promptEngine.format('test_generation', {
      file_path: params.filePath,
      language: params.language,
      symbol_name: params.symbol.name,
      symbol_type: params.symbol.type,
      code: params.symbol.code,
      test_framework: framework,
    });

    return this.llmClient.generate({
      system,
      prompt,
      temperature: 0.1,
    });
  }

  /**
   * Streams generated test code
   */
  public async *streamGenerateTests(
    params: GenerateTestParams,
  ): AsyncGenerator<string, void, unknown> {
    const framework = params.testFramework || this.getDefaultTestFramework(params.language);
    const { system, prompt } = this.promptEngine.format('test_generation', {
      file_path: params.filePath,
      language: params.language,
      symbol_name: params.symbol.name,
      symbol_type: params.symbol.type,
      code: params.symbol.code,
      test_framework: framework,
    });

    for await (const token of this.llmClient.streamGenerate({ system, prompt, temperature: 0.1 })) {
      yield token;
    }
  }

  /**
   * Synthesize unit test stub offline (fallback or fast preview generator)
   */
  public createStaticTestStub(symbol: ASTSymbol, filePath: string, language: string): string {
    if (language === 'typescript' || language === 'javascript') {
      const isClass = symbol.type === 'class';
      return [
        `import { describe, it, expect, vi } from 'vitest';`,
        `import { ${symbol.name} } from './${filePath.replace(/\\/g, '/').replace(/\.[^/.]+$/, '')}';`,
        '',
        `describe('${symbol.name}', () => {`,
        `  it('should be defined and initialized', () => {`,
        isClass
          ? `    const instance = new ${symbol.name}();\n    expect(instance).toBeDefined();`
          : `    expect(typeof ${symbol.name}).toBe('function');`,
        `  });`,
        '',
        `  it('handles normal execution path', async () => {`,
        `    // TODO: Verify primary input/output assertions`,
        `    expect(true).toBe(true);`,
        `  });`,
        '',
        `  it('handles boundary and error conditions', async () => {`,
        `    // TODO: Verify edge case handling`,
        `    expect(true).toBe(true);`,
        `  });`,
        `});`,
      ].join('\n');
    }

    if (language === 'python') {
      return [
        `import unittest`,
        `from ${filePath.replace(/\\/g, '/').replace(/\.py$/, '').replace(/\//g, '.')} import ${symbol.name}`,
        '',
        `class Test${symbol.name}(unittest.TestCase):`,
        `    def setUp(self):`,
        `        pass`,
        '',
        `    def test_default_behavior(self):`,
        `        # Verify primary assertion`,
        `        self.assertIsNotNone(${symbol.name})`,
        '',
        `    def test_edge_cases(self):`,
        `        # Verify boundary conditions`,
        `        self.assertTrue(True)`,
        '',
        `if __name__ == '__main__':`,
        `    unittest.main()`,
      ].join('\n');
    }

    return `// Test stub for ${symbol.name} (${language})\n`;
  }
}
