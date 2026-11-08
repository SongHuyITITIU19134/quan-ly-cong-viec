import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { pwaPlugin } from './scripts/pwa-plugin.mjs'

export default defineConfig({
  plugins: [react(),pwaPlugin()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/d3-')) return 'd3-vendor'
          if (id.includes('victory-vendor')) return 'victory-vendor'
          if (id.includes('recharts')) return 'charts-vendor'
          if (id.includes('@firebase/firestore') || id.includes('@firebase+firestore') || id.includes('/firebase/firestore')) return 'firebase-firestore'
          if (id.includes('@firebase/auth') || id.includes('@firebase+auth') || id.includes('/firebase/auth')) return 'firebase-auth'
          if (id.includes('@firebase')) return 'firebase-core'
          if (id.includes('/firebase/')) return 'firebase-core'
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) return 'react-vendor'
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    css: true,
    include: ['tests/**/*.test.{js,jsx}'],
    exclude: ['tests/rules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/main.jsx'],
      reporter: ['text','json-summary'],
      thresholds: {
        lines: 70,
        'src/lib/**': {lines:80},
        'src/tags/**': {lines:80},
        'src/data/**': {lines:80},
      },
    },
  },
})
