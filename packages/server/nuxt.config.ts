// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxt/ui", "@pinia/nuxt"],
  devServer: {
    host: "0.0.0.0",
    port: 10001
  },
  nitro: {
    experimental: {
      websocket: true
    },
    storage: {
      db: {
        driver: 'fs',
        base: './db'
      }
    }
  }
})