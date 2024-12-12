import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: './',
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
})
