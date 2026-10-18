import NuxtPostgrest from '../../../src/module'

export default defineNuxtConfig({
  modules: [NuxtPostgrest],
  runtimeConfig: {
    public: {
      postgrestUrl: process.env.POSTGREST_URL || 'http://localhost:3001',
    },
    postgrestSecretKey: process.env.NUXT_POSTGREST_SECRET_KEY || '',
    postgrestJwtSecret: process.env.NUXT_POSTGREST_JWT_SECRET || '',
  },
  compatibilityDate: 'latest',
})
