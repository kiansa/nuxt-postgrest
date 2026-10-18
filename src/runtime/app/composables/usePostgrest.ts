import type { PostgrestClient } from '@supabase/postgrest-js'
import { createPostgrestClient } from '../../shared/utils/createPostgrestClient'
import { createAuthorizedFetch } from '../../shared/utils/authorizedFetch'
import { POSTGREST_TOKEN_COOKIE, getUsableToken, readCookieValue } from '../../shared/utils/token'
import { useCookie, useRuntimeConfig } from '#imports'
import type { Database } from '#build/types/postgrest-database'

export interface UsePostgrestOptions {
  /** Explicit JWT. Takes precedence over the token cookie and the anon key. */
  token?: string
  /** Extra headers merged into every request. */
  headers?: Record<string, string>
}

/**
 * PostgREST client for the current user, usable in components, pages and plugins (client + SSR).
 *
 * Token resolution: `options.token` → token cookie (see `setPostgrestToken`) → public anon key → no header.
 *
 * In the browser the cookie is read on every request, so a client created once (in a store or plugin, say)
 * keeps up with logging in, logging out and expiry. During SSR it is read once, when the client is created.
 */
export function usePostgrest(options: UsePostgrestOptions = {}): PostgrestClient<Database> {
  const { postgrestUrl: url, postgrestKey: key } = useRuntimeConfig().public

  if (!url) {
    throw new Error('[nuxt-postgrest] Missing PostgREST URL. Set NUXT_PUBLIC_POSTGREST_URL or `runtimeConfig.public.postgrestUrl`.')
  }

  if (import.meta.server) {
    const cookie = useCookie<string | null>(POSTGREST_TOKEN_COOKIE, { readonly: true })

    return createPostgrestClient<Database>({
      url,
      key: options.token || getUsableToken(cookie.value) || key || undefined,
      headers: options.headers,
    }) as PostgrestClient<Database>
  }

  // An Authorization header passed in `headers` is the caller's explicit choice, so leave it alone
  const keepAuthorization = Object.keys(options.headers ?? {}).some(name => name.toLowerCase() === 'authorization')

  return createPostgrestClient<Database>({
    url,
    headers: options.headers,
    fetch: createAuthorizedFetch({
      keepAuthorization,
      getToken: () => options.token || getUsableToken(readCookieValue(document.cookie, POSTGREST_TOKEN_COOKIE)) || key || undefined,
    }),
  }) as PostgrestClient<Database>
}
