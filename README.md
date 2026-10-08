# DeepRepo – The Dark Side

<p align="center">
  <img src="apps/desktop/src/assets/logo.svg" alt="DeepRepo Logo" width="120" />
</p>

<p align="center">
  <strong>Local Codebase RAG & Semantic Explorer</strong><br>
  <em>Index code once, query offline forever. Zero cloud calls, zero vendor lock-in.</em>
</p>

---

## ⚡ Core Value Proposition

- **100% Local & Private**: No code or prompts leave your workstation.
- **Instant Codebase Comprehension**: Onboard on massive repositories in minutes rather than weeks.
- **AST-Aware Semantic Search**: Retrieves relevant functions, classes, and interfaces by meaning, not simple keyword matching.
- **Offline LLM Chat (RAG)**: Chat with your code via local Ollama (Mistral 7B / Llama 2) with streaming responses and exact source line attribution.
- **Automated Test Generation**: Generate unit test suites (Vitest, Jest, Python unittest) from AST signatures.
- **Multi-File Explanation**: Trace logic, dependencies, and complex control flows across modules.

---

## 🏗 Monorepo Architecture

```
deeprepo/
├── apps/
│   └── desktop/               # Desktop app (React 18 + Vite + Tailwind + Tauri)
├── packages/
│   ├── core/                  # AST parser, chunker, git handler, vector DB, RAG & features
│   ├── embed-model/           # Nomic Embed Text v1.5 ONNX loader & vectorizer
│   ├── llm-bridge/            # Ollama local inference client & stream decoders
│   ├── ui-shared/             # Reusable UI components & Prism code blocks
│   └── config/                # Environment schemas & global constants
├── e2e/                       # Playwright end-to-end tests & sample repository fixtures
├── docs/                      # Architecture, Setup, and User Guides
└── .github/                   # CI/CD workflows (Tests, Lint, Matrix Builds, Releases)
```

---

## 🚀 Quick Start

### 1. Prerequisites

- **Node.js** v20+
- **pnpm** v9+ (`corepack enable`)
- **Ollama** installed and running locally with `mistral:7b`:
  ```bash
  ollama run mistral:7b
  ```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Development Server

```bash
pnpm dev
```

### 4. Run Unit and Integration Tests

```bash
pnpm test
pnpm test:coverage
```

---

## 🛡 License

MIT License. Created for developers with high security and privacy requirements.
