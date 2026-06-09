import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  // PGlite's Emscripten runtime references a bare `process` (e.g. `process.exitCode`)
  // without a Node-environment guard. Vite only statically replaces `process.env.*`,
  // so in the production browser bundle `process` is undefined and DB init throws
  // "process is not defined". Define a minimal global shim — kept free of
  // `versions.node` so Emscripten still selects the browser code path.
  define: {
    process: "(globalThis.process ??= { env: {}, argv: [] })",
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt"],
      manifest: {
        name: "Hymnos - ϩⲩⲙⲛⲟⲥ",
        short_name: "Hymnos",
        description: "مكتبة شاملة لعرض كتب الليتورجيا الكنسية و الترانيم",
        theme_color: "#1e293b",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "any",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
      workbox: {
        // Precache EVERY asset the app needs to run fully offline: the app shell
        // (js/css/html), the pglite WASM + .data image + runtime extension
        // bundles (.gz/.tar, e.g. pg_trgm), all fonts, all images, the bundled
        // import .zip seed data, and the web manifest.
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,gif,avif,woff,woff2,ttf,eot,wasm,data,zip,gz,tar,json,txt,webmanifest}"],
        // pglite's WASM is ~10MB; allow large entries into the precache.
        maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
        // Drop stale precaches when a new service worker activates.
        cleanupOutdatedCaches: true,
        // SPA deep links / refreshes work offline by serving the app shell.
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/assets\//],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@db": path.resolve(__dirname, "./src/db"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@fractions": path.resolve(__dirname, "./src/fractions"),
      "@contexts": path.resolve(__dirname, "./src/contexts"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@routes": path.resolve(__dirname, "./src/routes"),
    },
  },
  optimizeDeps: {
    exclude: ["@electric-sql/pglite"],
  },
});
