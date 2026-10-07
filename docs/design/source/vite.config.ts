// Versão portátil do vite.config.ts do Figma Make.
// O original também carregava plugins internos do Make (site.json,
// error overlay, kit de stories), que só existem dentro do Figma.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
