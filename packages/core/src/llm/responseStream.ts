export { decodeOllamaStream, type OllamaStreamChunk } from '@deeprepo/llm-bridge';

export interface StreamEventCallbacks {
  onToken?: (token: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (err: Error) => void;
}

export async function consumeResponseStream(
  tokenGenerator: AsyncGenerator<string, void, unknown>,
  callbacks: StreamEventCallbacks,
): Promise<string> {
  let accumulated = '';
  try {
    for await (const token of tokenGenerator) {
      accumulated += token;
      callbacks.onToken?.(token);
    }
    callbacks.onComplete?.(accumulated);
    return accumulated;
  } catch (err: any) {
    callbacks.onError?.(err);
    throw err;
  }
}
