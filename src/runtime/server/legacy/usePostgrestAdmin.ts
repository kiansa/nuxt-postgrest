// Nuxt 4.0 to 4.5. See ../utils for the Nuxt 4.6+ version.
import type { PostgrestClient } from '@supabase/postgrest-js'
import { useRuntimeConfig } from '#imports'
import { createAdminClient } from '../../shared/utils/serverCore'
import type { Database } from '#build/types/postgrest-database'

let adminClient: PostgrestClient<Database> | undefined

/**
 * Privileged PostgREST client using the server-only secret JWT. Server routes only.
 * Bypasses row-level security if the secret's role does. Use `.schema('name')` to switch schemas.
 */
export function usePostgrestAdmin(): PostgrestClient<Database> {
  if (adminClient) return adminClient

  const config = useRuntimeConfig()
  adminClient = createAdminClient(config.public.postgrestUrl, config.postgrestSecretKey)
  return adminClient
}
