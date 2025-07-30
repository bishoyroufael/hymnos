module.exports = {
  globDirectory: "dist/",
  globPatterns: [
    "**/*.{css,js,ico,png,html,json,svg,ttf,woff2,woff,eot,wasm,data,gz,zip}",
  ],
  swDest: "dist/sw.js",
  maximumFileSizeToCacheInBytes: 10 * 1024 ** 2,
  ignoreURLParametersMatching: [/^utm_/, /^fbclid$/],
  runtimeCaching: [
    {
      urlPattern: /\.(?:zip)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "data-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      urlPattern: /\.(?:ttf|woff2?|eot)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "fonts-cache",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "images-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:wasm|data|gz)$/,
      handler: "CacheFirst",
      options: {
        cacheName: "wasm-cache",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 30 days
        },
      },
    },
  ],
};
