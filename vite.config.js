import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const rawBasePath = globalThis?.process?.env?.VITE_BASE_PATH
const repoSlug = globalThis?.process?.env?.GITHUB_REPOSITORY || ''
const repoName = repoSlug.split('/')[1] || ''
const inferredBasePath = repoName && repoName.endsWith('.github.io')
  ? '/'
  : repoName
    ? `/${repoName}/`
    : '/'
const basePath = rawBasePath || inferredBasePath

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  plugins: [react()],
  server: {
    proxy: {
      '/api/topic': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/api/health': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'motion';
          }
        },
      },
    },
  },
})
