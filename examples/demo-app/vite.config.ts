import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@stellar-wallet-connect/react': resolve(__dirname, '../../packages/react/src/index.ts'),
      '@stellar-wallet-connect/core': resolve(__dirname, '../../packages/core/src/index.ts'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
  },
});
