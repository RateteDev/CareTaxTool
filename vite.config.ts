import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { loadEnv } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue()],
    base: mode === 'production' ? '/' : '/',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      // ソースマップを生成して、デバッグを容易にする
      sourcemap: true,
    },
    server: {
      // 開発サーバーの設定
      port: 5173,
      strictPort: true,
      // HMRの設定
      hmr: {
        overlay: true,
      },
    },
  }
})
