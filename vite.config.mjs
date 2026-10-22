import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    watch: {
      usePolling: true,
      interval: 200,
      ignored: ['**/.git/**'],
    },
    headers: { 'Cache-Control': 'no-store' },
  },
  plugins: [{
    name: 'reload-static-content',
    handleHotUpdate({ file, server }) {
      // Classic scripts and fetched JSON need a fresh page to rerun safely.
      if (/\.(js|json)$/.test(file) && !file.includes('/node_modules/')) {
        server.ws.send({ type: 'full-reload', path: '*' });
        return [];
      }
    },
  }],
});
