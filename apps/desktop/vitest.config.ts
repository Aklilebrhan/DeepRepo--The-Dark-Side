import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    alias: {
      '@deeprepo/config': path.resolve(__dirname, '../../packages/config/src/index.ts'),
      '@deeprepo/core': path.resolve(__dirname, '../../packages/core/src/index.ts'),
      '@deeprepo/embed-model': path.resolve(__dirname, '../../packages/embed-model/src/index.ts'),
      '@deeprepo/llm-bridge': path.resolve(__dirname, '../../packages/llm-bridge/src/index.ts'),
      '@deeprepo/ui-shared': path.resolve(__dirname, '../../packages/ui-shared/src/index.ts'),
    },
  },
});
