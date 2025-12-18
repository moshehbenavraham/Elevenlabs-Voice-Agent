import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8082,
  },
  plugins: [react(), mode === 'development' && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
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
          // UI utilities
          'ui-utils': ['class-variance-authority', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
}));
