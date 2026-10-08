# Changelog

All notable changes to the DeepRepo (The Dark Side) project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-10-08

### Added

- Monorepo structure using pnpm workspaces (`apps/desktop`, `packages/core`, `packages/embed-model`, `packages/llm-bridge`, `packages/ui-shared`, `packages/config`, `e2e`).
- Tree-sitter code parser with AST symbol extraction (functions, classes, interfaces) supporting TypeScript, JavaScript, Python, Go, Java.
- AST-aware semantic code chunker with sliding token window and overlap preservation.
- Local Git operations using isomorphic-git.
- Incremental indexing pipeline with file hash tracking and SQLite state store.
- Vector database adapter supporting Chroma and lightweight local vector storage.
- Local embedding pipeline utilizing Nomic Embed Text v1.5 with ONNX Runtime via Xenova Transformers.js.
- Local LLM bridge with Ollama HTTP client supporting streaming responses and Mistral 7B / Llama 2.
- Semantic code search and RAG context assembler with token budget management.
- AST-driven unit test generation (Jest/Vitest/unittest) and multi-file code explanation.
- Desktop application with Tauri backend and React 18 frontend (Vite, Tailwind CSS, Lucide icons, Prism syntax highlighting).
- Full suite of unit tests, integration tests, and Playwright E2E tests.
- GitHub Actions CI/CD workflows for testing, linting, matrix builds, E2E, and releases.
