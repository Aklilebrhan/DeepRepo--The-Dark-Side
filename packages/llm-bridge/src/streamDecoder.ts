export interface OllamaStreamChunk {
  model?: string;
  created_at?: string;
  response?: string;
  message?: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

/**
 * Decodes chunks from an async iterable byte/text stream into typed Ollama stream objects
 */
export async function* decodeOllamaStream(
  stream: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array | string>,
): AsyncGenerator<OllamaStreamChunk, void, unknown> {
  let buffer = '';
  const textDecoder = new TextDecoder();

  // If stream is a web ReadableStream
  if ('getReader' in stream) {
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text =
          typeof value === 'string' ? value : textDecoder.decode(value, { stream: true });
        buffer += text;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const parsed = JSON.parse(trimmed) as OllamaStreamChunk;
            yield parsed;
          } catch {
            // Ignore malformed intermediate chunks
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } else {
    // If stream is AsyncIterable
    for await (const chunk of stream) {
      const text = typeof chunk === 'string' ? chunk : textDecoder.decode(chunk, { stream: true });
      buffer += text;
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          const parsed = JSON.parse(trimmed) as OllamaStreamChunk;
          yield parsed;
        } catch {
          // Ignore malformed intermediate chunks
        }
      }
    }
  }

  // Process any residual trailing line in buffer
  const finalTrimmed = buffer.trim();
  if (finalTrimmed) {
    try {
      const parsed = JSON.parse(finalTrimmed) as OllamaStreamChunk;
      yield parsed;
    } catch {
      // Ignore
    }
  }
}
