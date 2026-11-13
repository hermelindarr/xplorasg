import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import tailwindcss from '@tailwindcss/vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Rutas públicas que van al sitemap (las fichas se agregan desde la API al compilar).
const STATIC_ROUTES = ['/', '/explorar', '/mapa', '/servicios', '/agenda', '/asistente', '/encuesta', '/nosotros', '/privacidad', '/terminos'];

/**
 * - Reemplaza __SITE_URL__ en index.html (og:image necesita una URL absoluta para WhatsApp).
 * - Al compilar con VITE_SITE_URL genera sitemap.xml (rutas + fichas de la API) y agrega la línea Sitemap a robots.txt.
 */
const siteMeta = (siteUrl: string, apiUrl: string): Plugin => ({
  name: 'xplorasg-site-meta',
  transformIndexHtml: (html) => html.replaceAll('__SITE_URL__', siteUrl).replaceAll('__API_URL__', apiUrl),
  async generateBundle() {
    if (!siteUrl) {
      this.warn('VITE_SITE_URL no está definido: no se genera sitemap.xml y og:image queda con ruta relativa.');
      return;
    }
    const slugs = async (path: string, prefix: string): Promise<string[]> => {
      try {
        const response = await fetch(`${apiUrl}${path}?limit=100`, { signal: AbortSignal.timeout(60_000) });
        const body = await response.json() as { data?: Array<{ slug?: string | null }> };
        return (body.data ?? []).map((item) => item.slug).filter(Boolean).map((slug) => `${prefix}/${slug}`);
      } catch {
        this.warn(`No se pudieron leer las fichas de ${apiUrl}${path}; el sitemap lleva solo las rutas fijas.`);
        return [];
      }
    };
    const routes = [...STATIC_ROUTES, ...await slugs('/api/catalogo/lugares', '/lugares'), ...await slugs('/api/catalogo/servicios', '/servicios')];
    const today = new Date().toISOString().slice(0, 10);
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${
      routes.map((route) => `  <url><loc>${siteUrl}${route}</loc><lastmod>${today}</lastmod></url>`).join('\n')
    }\n</urlset>\n`;
    this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: xml });
    const robots = readFileSync(resolve(__dirname, 'public/robots.txt'), 'utf8').trimEnd();
    this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `${robots}\n\nSitemap: ${siteUrl}/sitemap.xml\n` });
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const siteUrl = (env.VITE_SITE_URL || '').replace(/\/+$/, '');
  const apiUrl = (env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
  return {
  plugins: [
    siteMeta(siteUrl, apiUrl),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'XploraSG',
        short_name: 'XploraSG',
        description: 'Turismo inteligente en la Sierra Gorda de Querétaro. Explora. Conecta. Vive la Sierra Gorda.',
        theme_color: '#2F5D3E',
        background_color: '#FAF7F1',
        lang: 'es-MX',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/xplorasg-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/xplorasg-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/xplorasg-icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,woff2,woff}'],
        // La foto del equipo no hace falta sin conexión.
        globIgnores: ['equipo/**'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/[^/]+\/api\/catalogo\/(municipios|categorias|lugares|servicios)(?:\/|\?|$)/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'xplorasg-catalogo-api',
              networkTimeoutSeconds: 4,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'xplorasg-map-tiles',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 250, maxAgeSeconds: 60 * 60 * 24 * 14 },
            },
          },
          {
            urlPattern: /\/storage\/v1\/object\/public\/xplorasg-public\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'xplorasg-public-media',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@supabase')) {
            return 'supabase';
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    host: true
  }
};
});
