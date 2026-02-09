import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  server: {
    port: 3001,
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          markdown: [
            'react-markdown',
            'remark-gfm',
            'remark-math',
            'rehype-katex',
            'rehype-highlight',
            'rehype-raw',
          ],
        },
      },
    },
  },
})
