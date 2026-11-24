import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Split the free-stack dependencies so no single bundle dominates first load.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (id.includes('leaflet') || id.includes('react-leaflet')) return 'maps'
          if (id.includes('gsap')) return 'animation'
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler') || id.includes('react-router')) return 'react-vendor'
          if (id.includes('axios') || id.includes('socket.io-client') || id.includes('engine.io-client')) return 'network'
        },
      },
    },
    chunkSizeWarningLimit: 550,
  },
})
