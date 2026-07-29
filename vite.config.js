import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import raw from 'vite-plugin-raw';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    raw({
      match: /\.(html|txt)$/, // This tells Vite to import .html and .txt files as raw strings
    }),
  ],

  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
        },
      },
    },
  },
});
