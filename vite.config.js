import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'node:path'

export default defineConfig({
  // '/' pour Vercel (routes profondes). './' uniquement pour le build Capacitor iOS.
  base: process.env.VITE_CAPACITOR === '1' ? './' : '/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      exceljs: resolve(import.meta.dirname, 'node_modules/exceljs/dist/exceljs.min.js'),
    },
  },
  build: {
    target: 'es2020',
  },
})
