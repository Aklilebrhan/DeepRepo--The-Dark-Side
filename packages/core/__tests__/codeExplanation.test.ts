import { describe, it, expect, vi } from 'vitest';
import { CodeExplainer } from '../src/features/codeExplanation';
import { OllamaClient } from '../src/llm/ollamaClient';

describe('CodeExplainer', () => {
  it('formats explanation prompt and generates explanation', async () => {
    const mockLlm = new OllamaClient();
    vi.spyOn(mockLlm, 'generate').mockResolvedValue(
      'This function calculates user credentials and validates tokens.',
    );

    const explainer = new CodeExplainer({ llmClient: mockLlm });
    const result = await explainer.explain({
      code: 'export function authenticate() { return true; }',
      filePath: 'src/auth.ts',
      startLine: 1,
      endLine: 5,
      language: 'typescript',
    });

    expect(result).toContain('calculates user credentials');
  });

  it('streams code explanation in real time', async () => {
    const mockLlm = new OllamaClient();
    async function* mockStream() {
      yield 'Calculates ';
      yield 'session.';
    }
    vi.spyOn(mockLlm, 'streamGenerate').mockImplementation(mockStream as any);

    const explainer = new CodeExplainer({ llmClient: mockLlm });
    const tokens: string[] = [];

    for await (const token of explainer.streamExplain({
      code: 'function test() {}',
      filePath: 'src/test.ts',
      startLine: 1,
      endLine: 3,
      language: 'typescript',
    })) {
      tokens.push(token);
    }

    expect(tokens.join('')).toBe('Calculates session.');
  });
});
