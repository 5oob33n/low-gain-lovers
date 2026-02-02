import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/low-gain-lovers/',
  plugins: [react()],
  build: {
    outDir: 'docs'
  }
})
