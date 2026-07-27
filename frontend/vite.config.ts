/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg'],
      manifest: {
        name: 'PosWeb — Punto de Venta',
        short_name: 'PosWeb',
        description: 'Sistema de punto de venta para kioscos',
        theme_color: '#1e293b',
        background_color: '#1e293b',
        display: 'standalone',
        orientation: 'portrait-primary',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icons.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          {
            src: 'icons.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
    }),
  ],
  build: {
    rollupOptions: {
      external: [
        '@tauri-apps/api',
        '@tauri-apps/api/app',
        '@tauri-apps/api/core',
        '@tauri-apps/plugin-updater',
        '@tauri-apps/plugin-shell',
        '@tauri-apps/plugin-http',
        '@tauri-apps/plugin-log',
      ],
    },
  },
  server: {
    host: true,
    watch: {
      ignored: ['**/src-tauri/target/**'],
    },
    allowedHosts: ['knee-volley-handwash.ngrok-free.dev'],
    proxy: {
      '/api': 'http://localhost:5196',
    },
  },
})
