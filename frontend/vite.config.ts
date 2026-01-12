import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    // Ensure these are properly replaced at build time
    '__PROD__': mode === 'production',
    '__DEV__': mode === 'development',
  },
  server: {
    port: 3000,
    host: true,
    // Proxy disabled for E2E tests - Playwright mocks will intercept API calls instead
    // Uncomment the proxy below for local development with backend
    /*
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
    */
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
}))