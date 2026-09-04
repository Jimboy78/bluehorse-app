import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const monorepoRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@bh/domain': `${monorepoRoot}packages/domain/src/index.ts`,
      '@bh/engine': `${monorepoRoot}packages/engine/src/index.ts`,
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt', no 'autoUpdate': si el service worker recarga la app en medio
      // de una serie, el usuario pierde lo que estaba cargando.
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'Blue Horse',
        short_name: 'Blue Horse',
        description: 'Tu entrenamiento en Blue Horse, adaptado a lo que hay en el gimnasio.',
        lang: 'es-AR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b1a2b',
        theme_color: '#0b1a2b',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff2}'],
        // Las fotos de máquinas viven en Supabase Storage: se cachean al usarlas,
        // no en la instalación, para no bajar 100 imágenes de una.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.includes('/storage/v1/object/public/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'bh-fotos-equipamiento',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  server: { port: 5173 },
  build: { target: 'es2022', sourcemap: true },
});
