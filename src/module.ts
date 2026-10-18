import { existsSync } from 'node:fs'
import {
  addImports,
  addServerImports,
  addTemplate,
  createResolver,
  defineNuxtModule,
  getNuxtVersion,
  resolvePath,
} from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'nuxt-postgrest',
    compatibility: {
      nuxt: '>=4.0.0',
    },
  },
  async setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url)

    // --- Runtime config ------------------------------------------------------
    // No module options: set these in `runtimeConfig` or with the matching env vars.
    const { runtimeConfig } = nuxt.options
    runtimeConfig.public.postgrestUrl ??= '' //       NUXT_PUBLIC_POSTGREST_URL
    runtimeConfig.public.postgrestKey ??= '' //       NUXT_PUBLIC_POSTGREST_KEY
    runtimeConfig.postgrestSecretKey ??= '' //        NUXT_POSTGREST_SECRET_KEY (usePostgrestAdmin)
    runtimeConfig.postgrestJwtSecret ??= '' //        NUXT_POSTGREST_JWT_SECRET (mintJwt, equals PostgREST's jwt-secret)

    // --- Database types ------------------------------------------------------
    const typesPath = await resolvePath('~~/shared/types/database.types.ts')
    addTemplate({
      filename: 'types/postgrest-database.d.ts',
      write: true,
      getContents: () => existsSync(typesPath)
        ? `export type { Database } from '${typesPath.replace(/(\.d)?\.ts$/, '')}'\n`
        : `// No types found at ${typesPath}. See https://kiansa.github.io/nuxt-postgrest/guide/types\nexport type Database = any\n`,
    })

    // --- Composables ---------------------------------------------------------
    const shared = resolver.resolve('./runtime/shared/utils/createPostgrestClient')

    addImports([
      { name: 'usePostgrest', from: resolver.resolve('./runtime/app/composables/usePostgrest') },
      { name: 'createPostgrestClient', from: shared },
    ])

    // Nuxt 4.6+ ships `nuxt/server`, the portable server helpers that also work on Nuxt 5 (Nitro v3). Older
    // Nuxt has no such entry point, so it gets an equivalent built on h3. Both sit on the same shared core.
    const server = hasPortableServerHelpers(getNuxtVersion(nuxt)) ? './runtime/server/utils' : './runtime/server/legacy'

    addServerImports([
      { name: 'usePostgrestUser', from: resolver.resolve(`${server}/usePostgrestUser`) },
      { name: 'usePostgrestAdmin', from: resolver.resolve(`${server}/usePostgrestAdmin`) },
      { name: 'mintJwt', from: resolver.resolve(`${server}/mintJwt`) },
      { name: 'setPostgrestToken', from: resolver.resolve(`${server}/postgrestToken`) },
      { name: 'clearPostgrestToken', from: resolver.resolve(`${server}/postgrestToken`) },
      { name: 'createPostgrestClient', from: shared },
    ])
  },
})

/** `nuxt/server` (the portable server helpers) exists from Nuxt 4.6 on. */
function hasPortableServerHelpers(version: string): boolean {
  const [major = 0, minor = 0] = version.split(/[.-]/).map(Number)
  return major > 4 || (major === 4 && minor >= 6)
}

declare module '@nuxt/schema' {
  interface PublicRuntimeConfig {
    /** PostgREST API URL. Env: `NUXT_PUBLIC_POSTGREST_URL`. */
    postgrestUrl: string
    /** Public anon JWT sent when there is no user token. Empty means no `Authorization` header. Env: `NUXT_PUBLIC_POSTGREST_KEY`. */
    postgrestKey: string
  }
  interface RuntimeConfig {
    /** JWT for `usePostgrestAdmin()`. Env: `NUXT_POSTGREST_SECRET_KEY`. */
    postgrestSecretKey: string
    /** Secret `mintJwt()` signs with. Must equal PostgREST's `jwt-secret`. Env: `NUXT_POSTGREST_JWT_SECRET`. */
    postgrestJwtSecret: string
  }
}
