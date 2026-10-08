/**
 * Global application constants for DeepRepo – The Dark Side
 */

export const APP_NAME = 'DeepRepo - The Dark Side';
export const APP_VERSION = '0.1.0';
export const DEFAULT_CONFIG_DIR = '.deeprepo';
export const ALT_CONFIG_DIR = '.gitmind';

export const DEFAULT_EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  '.deeprepo',
  '.gitmind',
  'dist',
  'build',
  'out',
  '.next',
  '.turbo',
  'coverage',
  '.vscode',
  '.idea',
  '__pycache__',
  '.venv',
  'venv',
  'target',
  'vendor',
];

export const SUPPORTED_LANGUAGES = ['typescript', 'javascript', 'python', 'go', 'java'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const EXTENSION_TO_LANGUAGE_MAP: Record<string, SupportedLanguage> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.py': 'python',
  '.go': 'go',
  '.java': 'java',
};

export const DEFAULT_CHUNK_SIZE_TOKENS = 512;
export const DEFAULT_CHUNK_OVERLAP_TOKENS = 50;
export const MAX_CHUNK_TOKENS = 1000;
export const MIN_CHUNK_TOKENS = 50;

export const DEFAULT_EMBEDDING_MODEL = 'nomic-ai/nomic-embed-text-v1.5';
export const EMBEDDING_DIMENSION = 384;

export const DEFAULT_LLM_HOST = 'http://localhost:11434';
export const DEFAULT_LLM_MODEL = 'mistral:7b';
export const FALLBACK_LLM_MODEL = 'llama2:7b';
export const LLM_TIMEOUT_MS = 30000;
export const MAX_HISTORY_MESSAGES = 5;
export const MAX_RETRIEVAL_CHUNKS = 5;
export const MAX_CONTEXT_TOKENS = 2000;
