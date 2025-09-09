import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    
  ],
  base: '/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    proxy: {
      '/mail': { target: 'http://localhost:4000', changeOrigin: true, secure: false },
      '/config': { target: 'http://localhost:4000', changeOrigin: true, secure: false },
      '/submissions': { target: 'http://localhost:4000', changeOrigin: true, secure: false },
      '/health': { target: 'http://localhost:4000', changeOrigin: true, secure: false },
    }
  }
})
