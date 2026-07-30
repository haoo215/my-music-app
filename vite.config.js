import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
   server: {
    port: 5173, // 可选：固定前端端口
    allowedHosts: true,
  proxy: {
  '/api': {
    target: 'http://localhost:8332',
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, '')
  }
}
  }
})
