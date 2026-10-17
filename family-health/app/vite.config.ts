import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/favicon.svg'],
      manifest: {
        name: 'สมุดสุขภาพครอบครัว',
        short_name: 'สมุดสุขภาพ',
        description: 'บันทึกสุขภาพ วัคซีน การเจ็บป่วย พัฒนาการ และผลการเรียนของครอบครัว',
        lang: 'th',
        theme_color: '#2f6fed',
        background_color: '#f4f6fb',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
