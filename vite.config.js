import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  build: {
    // Warn if any chunk exceeds 600 kB (three.js chunk is ~435 kB, well under)
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        // Keep Three.js in its own cached chunk so React re-deploys don't bust
        // the Three.js cache and vice-versa.
        manualChunks: {
          three: ['three'],
          react: ['react', 'react-dom'],
        },

        // Stable, content-hashed filenames — Netlify CDN caches them forever.
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // Produce a modern build; no need for IE11 polyfills.
    target: 'es2020',

    // Source maps off in production (smaller bundles, no source leakage).
    sourcemap: false,

    // Minify with esbuild (Vite default, fastest).
    minify: 'esbuild',
  },
});
