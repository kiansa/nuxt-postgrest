// Nuxt 4.0 to 4.5. See ../utils for the Nuxt 4.6+ version.
import { getCookie } from 'h3'
import type { PostgrestClient } from '@supabase/postgrest-js'
import { useRuntimeConfig } from '#imports'
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
  const { postgrestUrl, postgrestKey } = useRuntimeConfig(event).public

  return createUserClient({ url: postgrestUrl, key: postgrestKey }, getCookie(event, POSTGREST_TOKEN_COOKIE), options)
}
