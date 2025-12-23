// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "The Weekly Shop",
        short_name: "Weekly Shop",
        description: "Smart UK shopping list app",
        theme_color: "#6366f1",
        background_color: "#F8F9FF",
        display: "standalone",
        icons: [
          {
            src: "/192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/256.png",
            sizes: "256x256",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/world\.openfoodfacts\.org\/api\/v2\/.*/i,
            handler: "NetworkFirst", // Try network, but use cache if offline
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],
});
