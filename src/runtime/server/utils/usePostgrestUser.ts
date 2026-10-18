import type { RequestEvent } from 'nuxt/server'
import { getCookie, useRuntimeConfig } from 'nuxt/server'
import type { PostgrestClient } from '@supabase/postgrest-js'
import { createPostgrestClient } from '../../shared/utils/createPostgrestClient'
import { POSTGREST_TOKEN_COOKIE, getUsableToken } from '../../shared/utils/token'
import type { ServerEvent } from '../../shared/types'
import type { Database } from '#build/types/postgrest-database'

export interface UsePostgrestUserOptions {
  /** Explicit JWT. Takes precedence over the token cookie and the anon key. */
  token?: string
  /** Extra headers merged into every request. */
  headers?: Record<string, string>
}

/**
 * PostgREST client acting as the requesting user, for Nitro server routes.
 * Row-level security applies as that user.
 *
 * Token resolution: `options.token` → token cookie (see `setPostgrestToken`) → public anon key → no header.
 */
export function usePostgrestUser(event: ServerEvent, options: UsePostgrestUserOptions = {}): PostgrestClient<Database> {
  const { postgrestUrl: url, postgrestKey: key } = useRuntimeConfig().public

  if (!url) {
    throw new Error('[nuxt-postgrest] Missing PostgREST URL. Set NUXT_PUBLIC_POSTGREST_URL or `runtimeConfig.public.postgrestUrl`.')
  }

  return createPostgrestClient<Database>({
    url,
    key: options.token || getUsableToken(getCookie(event as RequestEvent, POSTGREST_TOKEN_COOKIE)) || key || undefined,
    headers: options.headers,
  }) as PostgrestClient<Database>
}
