import { describe, it, expect, vi } from 'vitest';
import { TestGenerator } from '../src/features/testGeneration';
import { OllamaClient } from '../src/llm/ollamaClient';
import { ASTSymbol } from '../src/types';

describe('TestGenerator', () => {
  it('generates Vitest/Jest test stub for TypeScript function with assertions', () => {
    const mockLlm = new OllamaClient();
    const generator = new TestGenerator({ llmClient: mockLlm });

    const symbol: ASTSymbol = {
      name: 'authenticateUser',
      type: 'function',
      startLine: 10,
      endLine: 25,
      params: ['username: string', 'password: string'],
      returnType: 'Promise<boolean>',
      code: 'export async function authenticateUser(username: string, password: string): Promise<boolean> { return true; }',
    };

    const stub = generator.createStaticTestStub(symbol, 'src/auth/service.ts', 'typescript');
    expect(stub).toContain("describe('authenticateUser'");
    expect(stub).toContain('expect(');
    expect(stub).toContain('authenticateUser');
  });

  it('generates Python unittest for Python function with assertions', () => {
    const mockLlm = new OllamaClient();
    const generator = new TestGenerator({ llmClient: mockLlm });

    const symbol: ASTSymbol = {
      name: 'compute_tax',
      type: 'function',
      startLine: 5,
      endLine: 12,
      params: ['subtotal: float', 'rate: float'],
      returnType: 'float',
      code: 'def compute_tax(subtotal: float, rate: float) -> float:\n    return subtotal * rate',
    };

    const stub = generator.createStaticTestStub(symbol, 'billing/calc.py', 'python');
    expect(stub).toContain('import unittest');
    expect(stub).toContain('class Testcompute_tax(unittest.TestCase):');
    expect(stub).toContain('self.assert');
  });

  it('formats LLM prompt and executes test generation', async () => {
    const mockLlm = new OllamaClient();
    vi.spyOn(mockLlm, 'generate').mockResolvedValue(
      "import { describe, it, expect } from 'vitest';\n\ndescribe('test', () => { it('works', () => { expect(1).toBe(1); }); });",
    );

    const generator = new TestGenerator({ llmClient: mockLlm });
    const symbol: ASTSymbol = {
      name: 'login',
      type: 'function',
      startLine: 1,
      endLine: 5,
      code: 'export function login() { return true; }',
    };

    const result = await generator.generateTests({
      symbol,
      filePath: 'src/login.ts',
      language: 'typescript',
    });

    expect(result).toContain('describe(');
    expect(result).toContain('expect(1).toBe(1)');
  });
});
