import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 設定 GitHub Pages 的路徑，請確保與您的倉庫名稱一致
  base: '/xq-dashboard/', 
})
