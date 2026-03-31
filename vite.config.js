import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // ── Proxy API → Backend FastAPI ──────────────────────────────────────────
  // Toutes les requêtes /api/* sont redirigées vers localhost:8000
  // Le frontend n'a donc jamais à connaître l'URL du backend, ni à gérer le CORS
  server: {
    proxy: {
      '/api': {
        target:      'http://localhost:8000',
        changeOrigin: true,
        // Pas de rewrite : /api/quote/AAPL → http://localhost:8000/api/quote/AAPL
      },
    },
  },
})
