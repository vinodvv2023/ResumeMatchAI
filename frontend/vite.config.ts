import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          headers: {
            ...(env.VITE_BLAXEL_API_KEY && env.VITE_BLAXEL_WORKSPACE ? {
              'X-Blaxel-Authorization': `Bearer ${env.VITE_BLAXEL_API_KEY}`,
              'X-Blaxel-Workspace': env.VITE_BLAXEL_WORKSPACE,
            } : {}),
          },
        }
      }
    }
  }
})
