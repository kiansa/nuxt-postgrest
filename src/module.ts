import { existsSync } from 'node:fs'
import {
  addImports,
  addServerImports,
  addTemplate,
  createResolver,
  defineNuxtModule,
  resolvePath,
} from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'nuxt-postgrest',
    compatibility: {
      nuxt: '>=4.6.1',
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

    addServerImports([
      { name: 'usePostgrestUser', from: resolver.resolve('./runtime/server/utils/usePostgrestUser') },
      { name: 'usePostgrestAdmin', from: resolver.resolve('./runtime/server/utils/usePostgrestAdmin') },
      { name: 'mintJwt', from: resolver.resolve('./runtime/server/utils/mintJwt') },
      { name: 'setPostgrestToken', from: resolver.resolve('./runtime/server/utils/postgrestToken') },
      { name: 'clearPostgrestToken', from: resolver.resolve('./runtime/server/utils/postgrestToken') },
      { name: 'createPostgrestClient', from: shared },
    ])
  },
})

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
