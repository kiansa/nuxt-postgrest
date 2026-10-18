import type { PostgrestClient } from '@supabase/postgrest-js'
import { createPostgrestClient } from '../../shared/utils/createPostgrestClient'
import { useRuntimeConfig } from 'nuxt/server'
import type { Database } from '#build/types/postgrest-database'

let adminClient: PostgrestClient<Database> | undefined

/**
 * Privileged PostgREST client using the server-only secret JWT. Server routes only.
 * Bypasses row-level security if the secret's role does. Use `.schema('name')` to switch schemas.
 */
export function usePostgrestAdmin(): PostgrestClient<Database> {
  if (adminClient) return adminClient

  const config = useRuntimeConfig()
  const { postgrestUrl: url } = config.public
  const { postgrestSecretKey: secretKey } = config

  if (!url) {
    throw new Error('[nuxt-postgrest] Missing PostgREST URL. Set NUXT_PUBLIC_POSTGREST_URL or `runtimeConfig.public.postgrestUrl`.')
  }
  if (!secretKey) {
    throw new Error('[nuxt-postgrest] Missing NUXT_POSTGREST_SECRET_KEY for admin access.')
  }

  adminClient = createPostgrestClient<Database>({ url, key: secretKey }) as PostgrestClient<Database>
  return adminClient
}
