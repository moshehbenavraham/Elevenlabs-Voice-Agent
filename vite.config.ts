import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const manualChunkGroups = {
  // Core React runtime
  'react-vendor': ['react', 'react-dom'],
  // Routing
  router: ['react-router-dom'],
  // State management
  query: ['@tanstack/react-query'],
  // Animation library (large)
  motion: ['framer-motion'],
  // Voice SDK
  elevenlabs: ['@elevenlabs/react'],
  vapi: ['@vapi-ai/web'],
  retell: ['retell-client-js-sdk'],
  ultravox: ['ultravox-client'],
  gemini: ['@google/genai'],
  // UI utilities
  'ui-utils': ['class-variance-authority', 'clsx', 'tailwind-merge'],
} as const;

/** Place each provider SDK in a stable lazy-loadable production chunk. */
function manualChunks(id: string): string | undefined {
  const modulePath = id.split('node_modules/').pop();
  if (!modulePath) return undefined;

  for (const [chunkName, packages] of Object.entries(manualChunkGroups)) {
    if (
      packages.some(
        (packageName) => modulePath === packageName || modulePath.startsWith(`${packageName}/`)
      )
    ) {
      return chunkName;
    }
  }

  return undefined;
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: '::',
    port: 8082,
    allowedHosts: ['localhost', '.ngrok.io', '.ngrok-free.app'],
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
}));
