import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true, // Enable PWA features during development
        },
        manifest: {
          name: 'Planless',
          short_name: 'Planless',
          description: 'Plan real-world activities with your friends.',
          theme_color: '#050505',
          background_color: '#050505',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          icons: [
            {
              src: '/assets/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/assets/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
          screenshots: [
            {
              src: '/assets/screenshot-mobile.png',
              sizes: '576x1024',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'Planless Mobile Application'
            },
            {
              src: '/assets/screenshot-desktop.png',
              sizes: '1024x576',
              type: 'image/png',
              form_factor: 'wide',
              label: 'Planless Desktop Application'
            }
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          // Exclude any API and supabase network calls from being cached by the service worker
          navigateFallbackDenylist: [/^\/api/, /supabase\.co/],
          runtimeCaching: [
            {
              urlPattern: /.*supabase\.co.*/,
              handler: 'NetworkOnly',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
