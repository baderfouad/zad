import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// BASE_PATH is set by the GitHub Pages workflow (e.g. "/zad/"). Locally it is "/".
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'data/*.csv'],
      manifest: {
        name: 'Zad · زاد',
        short_name: 'Zad',
        description: 'Predicts tomorrow\'s food needs for hotel buffets and restaurants in Qatar.',
        lang: 'ar',
        dir: 'rtl',
        theme_color: '#2E1E15',
        background_color: '#ECE3D1',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,csv}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            // Data: always try the network first so edits show after a reload, fall back to cache offline.
            urlPattern: ({ url }) => url.pathname.endsWith('.csv'),
            handler: 'NetworkFirst',
            options: { cacheName: 'zad-data', networkTimeoutSeconds: 3 },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'zad-fonts', expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
  test: { environment: 'node' },
});
