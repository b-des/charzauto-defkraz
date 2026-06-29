import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import {VitePWA} from 'vite-plugin-pwa';


// https://vite.dev/config/
export default defineConfig({
      base: '/charzauto-defkraz/',
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                maximumFileSizeToCacheInBytes: 3000000 // Set limit to 3 MB
            },
            includeAssets: ['favicon.svg'],
            manifest: {
                name: 'DefKraz',
                short_name: 'DefKraz',
                description: 'Дефектовка автомобілів ЧАРЗ',
                theme_color: '#ffffff',
                maximumFileSizeToCacheInBytes: 3000000,
                icons: [
                    {
                        src: 'web-app-manifest-192x192.png',
                        sizes: '192x192',
                        type: 'image/png'
                    },
                    {
                        src: 'web-app-manifest-512x512.png',
                        sizes: '512x512',
                        type: 'image/png'
                    }
                ]
            }
        })
    ]
})
