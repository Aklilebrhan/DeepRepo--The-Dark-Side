import { describe, it, expect } from 'vitest';
import { consumeResponseStream } from '../src/llm/responseStream';

describe('consumeResponseStream', () => {
  it('accumulates tokens and calls lifecycle callbacks', async () => {
    async function* makeTokens() {
      yield 'Hello ';
      yield 'world!';
    }

    const emitted: string[] = [];
    let completed = '';

    const res = await consumeResponseStream(makeTokens(), {
      onToken: (t) => emitted.push(t),
      onComplete: (full) => {
        completed = full;
      },
    });

    expect(res).toBe('Hello world!');
    expect(emitted).toEqual(['Hello ', 'world!']);
    expect(completed).toBe('Hello world!');
  });
});
