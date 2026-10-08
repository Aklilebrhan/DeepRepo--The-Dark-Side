/**
 * Utility helper functions for sample repository
 */

export function formatGreeting(name: string): string {
  if (!name) return 'Hello, World!';
  return `Hello, ${name.trim()}!`;
}

export function parseQueryString(query: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!query) return result;
  const pairs = query.replace(/^\?/, '').split('&');
  for (const pair of pairs) {
    const [k, v] = pair.split('=');
    if (k) result[decodeURIComponent(k)] = decodeURIComponent(v || '');
  }
  return result;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
