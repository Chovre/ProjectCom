import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            if (!res.headersSent) {
              res.writeHead(503, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                status: 503,
                error: 'Backend Service Unavailable',
                message: 'The Spring Boot backend is not running on http://localhost:8081. Please start the backend service with PostgreSQL.',
              }));
            }
          });
        },
      }
    }
  }
})
