import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  // .env / .env.production などの環境変数を読み込む
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // VITE_BASE_URL を設定すれば任意のパスにデプロイ可能
    // 未設定時は '/Web_kenz/' にフォールバック
    base: env.VITE_BASE_URL ?? '/Web_kenz/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    optimizeDeps: {
      exclude: ['pdfjs-dist'],
    },
  }
})
