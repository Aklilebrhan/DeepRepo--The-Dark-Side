# Contributing to DeepRepo – The Dark Side

Thank you for contributing to DeepRepo! Follow these instructions to keep the codebase clean, stable, and tested.

## Development Workflow

1. Fork & clone the repository.
2. Install dependencies with `pnpm install`.
3. Create a feature branch following Conventional Commits:
   - `feat: add Go tree-sitter AST queries`
   - `fix: resolve token overflow in context assembler`
   - `test: add integration test for incremental file deletion`

## Coding Standards

- All code must be strictly typed TypeScript (`strict: true`).
- No direct `console.log` statements in core packages; use `createLogger()` from `@deeprepo/core/config/logger`.
- Write unit tests first (TDD workflow) under `packages/<package>/__tests__/`.
- Ensure all tests pass before opening a pull request:
  ```bash
  pnpm lint
  pnpm typecheck
  pnpm test
  ```
