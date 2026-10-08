# User Guide – DeepRepo (The Dark Side)

Welcome to DeepRepo, your offline semantic codebase explorer and AI pair programmer.

## Key Capabilities

1. **Local Repository Indexing**
   - Click **Select Repository** or type your local Git repository folder.
   - DeepRepo initiates AST analysis on supported files (TypeScript, JavaScript, Python, Go, Java).
   - Code is sliced into semantic AST blocks (functions, classes, interfaces).
   - Embeddings are generated locally using the `nomic-embed-text-v1.5` ONNX model.
   - Vectors are written into `.deeprepo/chroma/` and file hashes are logged into `.deeprepo/state.db`.

2. **Semantic Code Search**
   - Enter questions or functional descriptions like:
     - `Where is JWT token verification handled?`
     - `Show me the database migration runner`
     - `How do we authenticate API requests?`
   - Review top semantic matches with syntax highlighting, exact file paths, line numbers, and similarity scores.

3. **Codebase Chat (RAG)**
   - Ask natural language questions in the chat window.
   - DeepRepo retrieves top matching code chunks and feeds them into the local Ollama LLM.
   - Answers stream in real-time with inline references and Markdown formatting.

4. **Automated Test Generation**
   - Select any function or class in the code explorer.
   - Click **Generate Tests**.
   - DeepRepo feeds the AST signature, parameter types, and implementation into the local model, generating idiomatic Jest, Vitest, or Python unittest suites.

5. **Code Explanation & Logic Walkthrough**
   - Select complex or unfamiliar methods and trigger **Explain Code**.
   - Get deep algorithmic explanations, edge cases, and dependency breakdowns.
