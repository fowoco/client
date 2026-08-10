import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8080',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    // bun으로 실행 시 기본 'forks' 풀이 워커 프로세스를 못 띄우고 타임아웃남 (Windows).
    // 'threads' 풀로 고정해서 bun/node 어느 런타임에서 돌려도 동일하게 동작하게 함.
    pool: 'threads',
  },
})
