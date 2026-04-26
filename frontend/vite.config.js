import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    // HMR WebSocket must advertise the host the browser connects to, not 0.0.0.0
    hmr: { host: 'localhost', port: 3000 },
    // Polling is required for bind-mounted volumes on Mac/Windows Docker
    watch: { usePolling: true, interval: 500 },
    proxy: {
      '/api': { target: 'http://backend:8000', changeOrigin: true },
    },
  },
})
