import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'XploraSG — Turismo Inteligente',
        short_name: 'XploraSG',
        description: 'Explora. Conecta. Vive la Sierra Gorda. Turismo digital inteligente de la Sierra Gorda de Querétaro.',
        // Colores oficiales de marca (guía visual XploraSG)
        theme_color: '#0D2B45',
        background_color: '#F2EDE1',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'es-MX',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precachea el "app shell" (HTML/CSS/JS) para que la app cargue
        // aunque no haya conexión (necesidad #1 de la Fase I: 97.3%
        // ha tenido problemas de conectividad).
        globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
        runtimeCaching: [
          {
            // Datos de la API: se intenta la red primero (información
            // actualizada); si no hay red, se sirve la última respuesta
            // exitosa guardada en caché. Esto complementa el respaldo
            // manual en localStorage (services/offlineCache.js).
            // NOTA: coincide con cualquier origen — así funciona igual en
            // desarrollo (localhost:4000) y en producción (dominio real),
            // sin tener que editar este archivo al desplegar.
            urlPattern: /\/api\/(lugares|municipios|categorias|eventos|recomendaciones)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'xplorasg-api-cache',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 }, // 7 días
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Tiles del mapa (OpenStreetMap): se cachean para poder ver
            // el mapa ya explorado incluso sin conexión.
            urlPattern: /^https:\/\/[a-z]\.tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'xplorasg-mapa-tiles',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }, // 30 días
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false, // el SW solo se activa en build de producción
      },
    }),
  ],
})
