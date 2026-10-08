import { describe, it, expect, vi, afterEach } from 'vitest';
import { OllamaClient, decodeOllamaStream, ModelManager } from '../src';

describe('decodeOllamaStream', () => {
  it('decodes newline-delimited JSON chunks correctly', async () => {
    const rawLines = [
      '{"model":"mistral:7b","response":"Hello","done":false}\n',
      '{"model":"mistral:7b","response":" world","done":false}\n',
      '{"model":"mistral:7b","response":"!","done":true}\n',
    ];

    async function* makeAsyncIterable() {
      for (const line of rawLines) {
        yield new TextEncoder().encode(line);
      }
    }

    const chunks = [];
    for await (const chunk of decodeOllamaStream(makeAsyncIterable())) {
      chunks.push(chunk);
    }

    expect(chunks).toHaveLength(3);
    expect(chunks[0].response).toBe('Hello');
    expect(chunks[1].response).toBe(' world');
    expect(chunks[2].response).toBe('!');
    expect(chunks[2].done).toBe(true);
  });
});

describe('ModelManager', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('checks running status and lists models', async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('/api/tags')) {
        return {
          ok: true,
          json: async () => ({
            models: [
              { name: 'mistral:7b', size: 4100000000 },
              { name: 'llama2:7b', size: 3800000000 },
            ],
          }),
        };
      }
      return { ok: false };
    }) as any;

    const manager = new ModelManager('http://localhost:11434');
    const running = await manager.isOllamaRunning();
    expect(running).toBe(true);

    const models = await manager.listModels();
    expect(models).toHaveLength(2);

    const hasMistral = await manager.hasModel('mistral:7b');
    expect(hasMistral).toBe(true);

    const hasCodellama = await manager.hasModel('codellama:7b');
    expect(hasCodellama).toBe(false);
  });
});

describe('OllamaClient', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('streams responses and joins full output', async () => {
    const rawChunks = [
      JSON.stringify({ response: 'The ', done: false }) + '\n',
      JSON.stringify({ response: 'answer is 42.', done: true }) + '\n',
    ];

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      body: {
        getReader() {
          let idx = 0;
          return {
            async read() {
              if (idx < rawChunks.length) {
                const chunk = new TextEncoder().encode(rawChunks[idx++]);
                return { done: false, value: chunk };
              }
              return { done: true, value: undefined };
            },
            releaseLock() {},
          };
        },
      },
    }) as any;

    const client = new OllamaClient();
    const tokens: string[] = [];

    for await (const token of client.streamGenerate({ prompt: 'Calculate life' })) {
      tokens.push(token);
    }

    expect(tokens.join('')).toBe('The answer is 42.');
  });
});
