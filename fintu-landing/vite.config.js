import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Puerto 5174 para poder correrlo junto a fintu-app (5173) en local.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
})
