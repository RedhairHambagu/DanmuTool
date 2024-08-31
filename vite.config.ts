import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import optimzer from 'vite-plugin-optimizer';
import path from 'path';


export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? './' : '/',
  root: path.join(__dirname, 'app'),
  plugins: [
    react(), 
    optimzer(
        {electron: 'const { ipcRenderer } = require("electron"); export { ipcRenderer }'}
    )],
  server: {
    port: 3000
  },
  // 确保这里指定了正确的入口文件
  build: {
    'outDir':path.join(__dirname, 'dist'), 
    assetsDir: '.',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: 'app/index.html',
      },
    },
  },
  css: {
    preprocessorOptions: {
      sass: {
        // Sass 选项
      }
    }
  },
    // 确保正确解析 .sass 文件
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'app/src')
      },
      extensions: ['.mjs','.js', '.ts', '.jsx', '.tsx', '.json', '.sass']
    }
});