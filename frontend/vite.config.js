import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const { BACKEND_URL = 'http://localhost:5000' } = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: BACKEND_URL,
          changeOrigin: true
        }
      }
    }
  }
})
