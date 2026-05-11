import babel from '@rolldown/plugin-babel';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/caloriecount/',
  plugins: [
    react(),
    babel({
      plugins: [['module:@preact/signals-react-transform']],
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Calorie Counter',
        short_name: 'CalCount',
        description: 'Track your daily calorie intake',
        theme_color: '#283618',
        background_color: '#fefae0',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/caloriecount/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
});
