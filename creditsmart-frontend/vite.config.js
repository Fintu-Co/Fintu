import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Separa las librerías pesadas en chunks propios: el navegador las
        // cachea aparte y no viajan todas juntas en un solo archivo gigante.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['chart.js', 'react-chartjs-2', 'chartjs-plugin-annotation'],
          pdf: ['jspdf', 'jspdf-autotable'],
          paypal: ['@paypal/react-paypal-js'],
        },
      },
    },
  },
})
