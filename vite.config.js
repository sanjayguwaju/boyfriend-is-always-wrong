import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Keep the big 3D library in its own cached chunk.
        manualChunks: { three: ['three'] },
      },
    },
  },
});
