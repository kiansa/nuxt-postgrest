export default defineNuxtConfig({
  modules: ['nuxt-auth-utils', 'nuxt-postgrest'],
  devtools: { enabled: true },
  runtimeConfig: {
    // Matches docker-compose.postgrest.yml. Override with NUXT_PUBLIC_POSTGREST_URL.
    public: { postgrestUrl: 'http://localhost:3001' },
    // The session and the PostgREST token last the same time (seconds)
    session: { maxAge: 60 * 60 * 24 },
    // Dev only. Must match PGRST_JWT_SECRET in docker-compose.postgrest.yml.
    postgrestJwtSecret: 'nuxt-postgrest-dev-secret-at-least-32-chars-long',
    // Dev only: a service_role token signed with that public dev secret
    // (`node scripts/dev-jwt.mjs service_role`). Override with NUXT_POSTGREST_SECRET_KEY.
    postgrestSecretKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.hDxk6MSsEId1Z46B2RehDPIAj35L3nqT6PMKNVYM_B0',
  },
  compatibilityDate: 'latest',
})
