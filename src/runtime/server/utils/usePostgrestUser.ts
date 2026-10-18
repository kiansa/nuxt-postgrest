import type { PostgrestClient } from '@supabase/postgrest-js'
import { getCookie, useRuntimeConfig } from 'nuxt/server'
import type { RequestEvent } from 'nuxt/server'
import { createUserClient } from '../../shared/utils/serverCore'
import type { UsePostgrestUserOptions } from '../../shared/utils/serverCore'
import { POSTGREST_TOKEN_COOKIE } from '../../shared/utils/token'
import type { ServerEvent } from './serverEvent'
import type { Database } from '#build/types/postgrest-database'

export type { UsePostgrestUserOptions }

/**
 * PostgREST client acting as the requesting user, for Nitro server routes.
 * Row-level security applies as that user.
 *
 * Token resolution: `options.token` → token cookie (see `setPostgrestToken`) → public anon key → no header.
 */
export function usePostgrestUser(event: ServerEvent, options: UsePostgrestUserOptions = {}): PostgrestClient<Database> {
  const { postgrestUrl, postgrestKey } = useRuntimeConfig().public

  // `nuxt/server` helpers are typed against `RequestEvent` but also run on h3 v1 events
  return createUserClient({ url: postgrestUrl, key: postgrestKey }, getCookie(event as RequestEvent, POSTGREST_TOKEN_COOKIE), options)
}
