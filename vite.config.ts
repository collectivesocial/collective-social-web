import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  // Get API URL from environment or fall back to localhost
  const apiUrl = env.VITE_API_URL || 'http://127.0.0.1:3000'

  return {
    plugins: [react()],
    server: {
      host: '127.0.0.1',
      port: 5173,
      proxy: {
        '/oauth': apiUrl,
        '/login': apiUrl,
        '/logout': apiUrl,
        '/oauth-client-metadata.json': apiUrl,
        '/.well-known': apiUrl,
      },
    },
  }
})
