import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 讀取對應模式下的環境變數（例如 .env.development / .env.production / .env.ghpages）
  const env = loadEnv(mode, process.cwd(), '')

  // 依據 VITE_BASE 調整部署路徑（預設為 '/'）
  const base = (env.VITE_BASE || '/').replace(/^(?!\/)/, '/').replace(/([^/])$/, '$1/')
  console.log('base:', base, mode)

  return {
    base,
    plugins: [vue(), vueDevTools(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
