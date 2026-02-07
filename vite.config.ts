import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/oauth': 'http://127.0.0.1:3000',
      '/login': 'http://127.0.0.1:3000',
      '/logout': 'http://127.0.0.1:3000',
      '/oauth-client-metadata.json': 'http://127.0.0.1:3000',
      '/.well-known': 'http://127.0.0.1:3000',
    },
  },
})
