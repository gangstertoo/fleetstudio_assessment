import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev mode the client runs on its own port (5173) but proxies /api
// requests to the Express server on 1234, so you never hit CORS issues
// locally. In production the server serves the built client directly,
// so this proxy is irrelevant.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:1234',
    },
  },
});
