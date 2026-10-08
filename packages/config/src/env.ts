import { z } from 'zod';
import {
  DEFAULT_LLM_HOST,
  DEFAULT_LLM_MODEL,
  DEFAULT_EMBEDDING_MODEL,
  DEFAULT_CHUNK_SIZE_TOKENS,
  DEFAULT_CHUNK_OVERLAP_TOKENS,
} from './constants';

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OLLAMA_HOST: z.string().url().default(DEFAULT_LLM_HOST),
  OLLAMA_MODEL: z.string().min(1).default(DEFAULT_LLM_MODEL),
  EMBEDDING_MODEL: z.string().min(1).default(DEFAULT_EMBEDDING_MODEL),
  CHUNK_TOKENS: z.coerce.number().positive().default(DEFAULT_CHUNK_SIZE_TOKENS),
  OVERLAP_TOKENS: z.coerce.number().nonnegative().default(DEFAULT_CHUNK_OVERLAP_TOKENS),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(env: Record<string, string | undefined> = process.env): EnvConfig {
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    const errorDetails = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ');
    throw new Error(`Environment configuration validation error: ${errorDetails}`);
  }
  return parsed.data;
}
