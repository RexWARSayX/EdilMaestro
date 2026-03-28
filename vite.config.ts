import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const repoName = 'EdilMaestro';
const basePath = `/${repoName}/`;

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg', 'mask-icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'EdilMaestro',
        short_name: 'EdilMaestro',
        description: 'Gestione mobile-first per cantieri, lavorazioni, costi e report.',
        theme_color: '#c96f18',
        background_color: '#f5efe4',
        display: 'standalone',
        start_url: basePath,
        scope: basePath,
        icons: [
          {
            src: 'apple-touch-icon.png',
            sizes: '100x100',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: 'mask-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      }
    })
  ]
});
