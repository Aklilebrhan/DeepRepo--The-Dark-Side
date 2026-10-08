/**
 * Fast and accurate token estimation for code and prompt text
 */

export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  // Code tends to have more punctuation and shorter tokens.
  // Standard heuristic: 1 token ~= 3.8 characters for code.
  const charBased = Math.ceil(text.length / 3.8);
  // Word & symbol split heuristic
  const tokens = text
    .trim()
    .split(/[\s,.;:()[\]{}'"+*=<>&!%^~?`/-]+/)
    .filter(Boolean);
  return Math.max(1, Math.round((charBased + tokens.length) / 2));
}

export function truncateToTokens(text: string, maxTokens: number): string {
  const current = estimateTokenCount(text);
  if (current <= maxTokens) return text;
  const ratio = maxTokens / current;
  const targetChars = Math.floor(text.length * ratio);
  return text.slice(0, targetChars) + '\n... [truncated for context limit]';
}
