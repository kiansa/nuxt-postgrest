import type { PostgrestClient } from '@supabase/postgrest-js'
import { createPostgrestClient } from '../../shared/utils/createPostgrestClient'
import { POSTGREST_TOKEN_COOKIE, getUsableToken } from '../../shared/utils/token'
import { useCookie, useRuntimeConfig } from '#imports'
import type { Database } from '#build/types/postgrest-database'

export interface UsePostgrestOptions {
  /** Explicit JWT. Takes precedence over the token cookie and the anon key. */
  token?: string
  /** Extra headers merged into every request. */
  headers?: Record<string, string>
}

function readBrowserCookie(name: string): string | undefined {
  for (const part of document.cookie.split('; ')) {
    const index = part.indexOf('=')
    if (part.slice(0, index) === name) {
      return decodeURIComponent(part.slice(index + 1))
    }
  }
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
  const hasOwnAuthorization = Object.keys(options.headers ?? {}).some(name => name.toLowerCase() === 'authorization')

  return createPostgrestClient<Database>({
    url,
    headers: options.headers,
    fetch: (input, init) => {
      if (hasOwnAuthorization) {
        return globalThis.fetch(input, init)
      }

      const token = options.token || getUsableToken(readBrowserCookie(POSTGREST_TOKEN_COOKIE)) || key || undefined
      const headers = new Headers(init?.headers)

      if (token) {
        headers.set('Authorization', `Bearer ${token}`)
      }
      else {
        headers.delete('Authorization')
      }

      return globalThis.fetch(input, { ...init, headers })
    },
  }) as PostgrestClient<Database>
}
