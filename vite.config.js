import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // '/' pour Vercel (routes profondes). './' uniquement pour le build Capacitor iOS.
  base: process.env.VITE_CAPACITOR === '1' ? './' : '/',
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
  },
})
