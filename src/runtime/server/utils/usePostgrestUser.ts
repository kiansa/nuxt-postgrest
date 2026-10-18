import type { H3Event } from 'h3'
import { getCookie } from 'h3'
import type { PostgrestClient } from '@supabase/postgrest-js'
import { createPostgrestClient } from '../../shared/utils/createPostgrestClient'
import { POSTGREST_TOKEN_COOKIE, getUsableToken } from '../../shared/utils/token'
import { useRuntimeConfig } from '#imports'
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
export function usePostgrestUser(event: H3Event, options: UsePostgrestUserOptions = {}): PostgrestClient<Database> {
  const { postgrestUrl: url, postgrestKey: key } = useRuntimeConfig(event).public

  if (!url) {
    throw new Error('[nuxt-postgrest] Missing PostgREST URL. Set NUXT_PUBLIC_POSTGREST_URL or `runtimeConfig.public.postgrestUrl`.')
  }

  return createPostgrestClient<Database>({
    url,
    key: options.token || getUsableToken(getCookie(event, POSTGREST_TOKEN_COOKIE)) || key || undefined,
    headers: options.headers,
  }) as PostgrestClient<Database>
}
