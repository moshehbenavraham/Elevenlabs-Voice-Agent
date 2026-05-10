import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    exclude: ['**/node_modules/**', '**/tests/e2e/**', '**/EXAMPLE/**'],
    env: {
      VITE_ELEVENLABS_ENABLED: 'true',
      VITE_ELEVENLABS_SDK_ENABLED: 'true',
      VITE_XAI_ENABLED: 'true',
      VITE_OPENAI_ENABLED: 'true',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
