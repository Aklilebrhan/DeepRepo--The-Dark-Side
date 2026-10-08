import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'packages/**/__tests__/**/*.{test,spec}.{ts,tsx}',
      'apps/desktop/src/__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/e2e/**', '**/*.d.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['packages/*/src/**/*.{ts,tsx}', 'apps/desktop/src/**/*.{ts,tsx}'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'build/**',
        'e2e/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        'apps/desktop/src/main.tsx',
      ],
    },
    alias: {
      '@deeprepo/core': path.resolve(__dirname, './packages/core/src/index.ts'),
      '@deeprepo/embed-model': path.resolve(__dirname, './packages/embed-model/src/index.ts'),
      '@deeprepo/llm-bridge': path.resolve(__dirname, './packages/llm-bridge/src/index.ts'),
      '@deeprepo/ui-shared': path.resolve(__dirname, './packages/ui-shared/src/index.ts'),
      '@deeprepo/config': path.resolve(__dirname, './packages/config/src/index.ts'),
    },
  },
});
