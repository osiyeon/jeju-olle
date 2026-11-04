import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// base './' → works on GitHub Pages subpath and on a custom domain alike
export default defineConfig({
  base: './',
  plugins: [react()],
})
