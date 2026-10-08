# Developer Setup Guide – DeepRepo (The Dark Side)

This document provides step-by-step instructions for configuring your development environment, building the monorepo, running unit and integration tests, and running the desktop application.

## Prerequisites

- **Node.js**: `v20.x` or higher (`v24.x` supported)
- **pnpm**: `v9.x` or higher (`corepack enable` && `corepack prepare pnpm@latest --activate`)
- **Rust Toolchain** (optional for Tauri desktop compilation): `rustup` + `cargo` (https://rustup.rs)
- **Ollama**: (https://ollama.ai) for local LLM inference
  ```bash
  ollama serve
  ollama pull mistral:7b
  ```

## Getting Started

### 1. Clone & Install Dependencies

```bash
git clone <repo-url> deeprepo
cd deeprepo
pnpm install
```

### 2. Prepare Local LLM

Ensure Ollama is running locally:

```bash
ollama run mistral:7b
```

DeepRepo communicates with Ollama over `http://localhost:11434`.

### 3. Run Unit & Integration Tests

```bash
# Run all unit tests across all packages
pnpm test

# Run tests with coverage reporting (v8)
pnpm test:coverage
```

### 4. Run Desktop Application (Development Mode)

```bash
# Launch Vite dev server with frontend UI
pnpm dev

# Or launch with Tauri native desktop runtime
pnpm --filter @deeprepo/desktop tauri:dev
```

### 5. Run E2E Test Suite

```bash
pnpm test:e2e
```
