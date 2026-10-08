import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    alias: {
      '@deeprepo/config': path.resolve(__dirname, '../config/src/index.ts'),
      '@deeprepo/embed-model': path.resolve(__dirname, '../embed-model/src/index.ts'),
      '@deeprepo/llm-bridge': path.resolve(__dirname, '../llm-bridge/src/index.ts'),
    },
  },
});
