import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "utils": path.resolve(__dirname, "./src/utils"),
    },
  },
  server: {
    host: "localhost",
    port: 5173,
    hmr: {
      port: 5173, // 使用与服务器相同的端口
      host: 'localhost'
    },
    cors: true
  },
  build: {
    // 性能优化配置
    rollupOptions: {
      output: {
        // 手动分块优化
        manualChunks: {
          // React相关
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI组件库
          'ui-vendor': [
            '@radix-ui/react-slot',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs'
          ],
          // 图表库
          'chart-vendor': ['recharts'],
          // 工具库
          'utils-vendor': [
            'date-fns',
            'clsx',
            'class-variance-authority',
            'tailwind-merge',
            'zustand',
            'immer'
          ],
          // 国际化
          'i18n-vendor': [
            'i18next',
            'react-i18next',
            'i18next-browser-languagedetector',
            'i18next-http-backend'
          ],
          // 图标库
          'icons-vendor': ['lucide-react'],
          // 表单处理
          'form-vendor': [
            'react-hook-form',
            '@hookform/resolvers'
          ]
        },
        // 文件命名优化
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // 压缩优化
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // 移除console.log
        drop_debugger: true, // 移除debugger
        pure_funcs: ['console.log', 'console.info', 'console.debug'], // 移除指定函数
      },
      output: {
        comments: false, // 移除注释
      },
    },
    // 分块大小警告限制
    chunkSizeWarningLimit: 1000,
    // 启用源码映射（开发时）
    sourcemap: process.env.NODE_ENV === 'development'
  },
  // CSS优化
  css: {
    devSourcemap: true
  }
})