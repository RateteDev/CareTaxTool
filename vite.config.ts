import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/',  // カスタムドメインを使用するため、ルートパスに変更
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
