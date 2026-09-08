import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const monorepoRoot = fileURLToPath(new URL('../../', import.meta.url));

export default defineConfig({
  // El .env vive en la raíz del monorepo (`cp .env.example .env`, ver
  // README.md), no en apps/web — sin esto Vite lo busca al lado de este
  // archivo y VITE_SUPABASE_URL/ANON_KEY quedan undefined en silencio.
  envDir: monorepoRoot,
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
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Blue Horse',
        short_name: 'Blue Horse',
        description: 'Tu entrenamiento en Blue Horse, adaptado a lo que hay en el gimnasio.',
        lang: 'es-AR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#05070c',
        theme_color: '#05070c',
        // El ícono real de Blue Horse es un PNG con degradé (ver
        // docs/07-marca-blue-horse.md): no hay versión vectorial. El maskable
        // lleva el escudo al 76% del lienzo porque Android recorta hasta un
        // 20% de cada borde y sin ese margen se come el anillo.
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
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
