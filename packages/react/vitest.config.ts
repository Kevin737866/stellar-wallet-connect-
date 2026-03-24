import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Resolve workspace package to its source (dist may not be built)
      '@stellar-wallet-connect/core': resolve(__dirname, '../core/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    typecheck: {
      tsconfig: './tsconfig.test.json',
    },
  },
});
