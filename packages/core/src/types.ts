import { SupportedLanguage } from '@deeprepo/config';

export type SymbolType = 'function' | 'class' | 'method' | 'interface' | 'type' | 'module';

export interface ASTSymbol {
  name: string;
  type: SymbolType;
  startLine: number;
  endLine: number;
  params?: string[];
  returnType?: string;
  docstring?: string;
  methods?: string[];
  attributes?: string[];
  code: string;
}

export interface CodeChunkMetadata {
  file_path: string;
  language: SupportedLanguage | string;
  start_line: number;
  end_line: number;
  symbol_name: string;
  symbol_type: SymbolType;
  dependencies: string[];
  imports_from: string[];
  file_hash: string;
  chunk_index: number;
  tokens: number;
  [key: string]: any;
}

export interface CodeChunk {
  id: string;
  content: string;
  metadata: CodeChunkMetadata;
  embedding?: number[];
}

export interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: CodeChunkMetadata;
}

export interface RepoFileRecord {
  file_path: string;
  language: SupportedLanguage | string;
  last_indexed: string;
  file_hash: string;
  status: 'indexed' | 'pending' | 'deleted';
}

export interface ChunkRecord {
  id: string;
  file_path: string;
  start_line: number;
  end_line: number;
  symbol_name: string;
  is_synced: number;
}

export interface RepoConfig {
  repo_path: string;
  indexed_at: string;
  llm_model: string;
  embed_model: string;
  chunk_tokens: number;
  overlap_tokens: number;
  excluded_dirs: string[];
  languages: string[];
}

export interface IndexProgress {
  phase: 'scanning' | 'parsing' | 'chunking' | 'embedding' | 'storing' | 'completed' | 'error';
  filesScanned: number;
  totalFiles: number;
  chunksCreated: number;
  embeddingsDone: number;
  totalChunks: number;
  currentFile?: string;
  error?: string;
}

export interface SearchResult {
  chunk: CodeChunk;
  score: number;
  distance?: number;
}

export interface PromptTemplateConfig {
  name: string;
  system: string;
  template: string;
  variables: string[];
}
