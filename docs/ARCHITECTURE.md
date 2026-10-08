# Architecture Overview – DeepRepo (The Dark Side)

DeepRepo is a desktop-native, privacy-first Retrieval-Augmented Generation (RAG) and semantic exploration platform for local Git repositories.

```mermaid
flowchart TD
    subgraph Frontend["Desktop UI (React 18 + Tauri / Vite)"]
        UI["RepoSelector & ChatWindow & CodePreview"]
        Zustand["State Management (Zustand)"]
        TauriCmd["Tauri Invoke Bridge / HTTP Fallback"]
    end

    subgraph CoreEngine["@deeprepo/core"]
        Scanner["Repo Scanner & GitHandler (isomorphic-git)"]
        Parser["AST Parser (Tree-sitter / Multi-language)"]
        Chunker["Semantic AST Chunker"]
        Tracker["File Tracker & Hash DB (state.db)"]
        Indexer["Indexing Pipeline Orchestrator"]
        VectorDB["Vector DB Adapter (Chroma / SQLite-vec)"]
        RAG["RAG Orchestrator & Context Builder"]
        Features["Test Generation & Code Explanation Engine"]
    end

    subgraph LocalML["Offline Machine Learning Engines"]
        Embedder["@deeprepo/embed-model (nomic-embed-text v1.5 via ONNX / Transformers.js)"]
        LLM["@deeprepo/llm-bridge (Ollama Mistral 7B / Llama 2 via SSE Stream)"]
    end

    UI --> Zustand --> TauriCmd
    TauriCmd --> Indexer
    TauriCmd --> RAG
    TauriCmd --> Features

    Indexer --> Scanner --> Tracker
    Scanner --> Parser --> Chunker
    Chunker --> Embedder
    Embedder --> VectorDB

    RAG --> Embedder
    RAG --> VectorDB
    RAG --> LLM
    Features --> RAG
```

## Architectural Design Principles

1. **Zero External Data Exfiltration**:
   Every layer executes locally. Embeddings are calculated on the CPU/GPU via ONNX runtime (`@xenova/transformers` with `nomic-embed-text-v1.5`), and inference connects strictly to local Ollama endpoints (`http://localhost:11434`).

2. **AST-Aware Chunking vs. Naive Splitting**:
   Code is parsed through AST structures to identify functional entities (functions, methods, classes, interfaces). Chunks retain docstrings, type signatures, and parent scope metadata rather than arbitrary line slices.

3. **Incremental Indexing via Content Hash Tracking**:
   Files are hashed (SHA-256) upon scanning. Only modified or added files undergo AST parsing and vectorization. Deleted files automatically trigger vector purge operations in Chroma.

4. **Token-Budgeted Context Assembly**:
   With local models having typical 8k context limits, DeepRepo dynamically allocates context budgets:
   - System instructions & prompt templates: ~500 tokens
   - Top-5 semantic chunks + surrounding line metadata: ~2000 tokens
   - Multi-turn conversation buffer (last 5 interactions): ~1000 tokens
   - Generation headroom: ~4000+ tokens

5. **Desktop Portability**:
   Tauri provides lightweight native shell performance with Rust bindings, cross-compilable for Windows, macOS, and Linux. Pure JavaScript Git operations via `isomorphic-git` eliminate external Git binary dependencies.
