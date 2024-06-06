// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@nuxt/ui", "@pinia/nuxt"],
  devServer: {
    host: true,
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