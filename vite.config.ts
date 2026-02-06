import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/groups': 'http://127.0.0.1:3000',
      '/users': 'http://127.0.0.1:3000',
      '/login': 'http://127.0.0.1:3000',
      '/logout': 'http://127.0.0.1:3000',
      '/oauth': 'http://127.0.0.1:3000',
      '/collections': 'http://127.0.0.1:3000',
      '/media': 'http://127.0.0.1:3000',
      '/feed': 'http://127.0.0.1:3000',
      '/share': 'http://127.0.0.1:3000',
      '/comments': 'http://127.0.0.1:3000',
      '/reactions': 'http://127.0.0.1:3000',
      '/tags': 'http://127.0.0.1:3000',
      '/admin': 'http://127.0.0.1:3000',
      '/feedback': 'http://127.0.0.1:3000',
    },
  },
})
