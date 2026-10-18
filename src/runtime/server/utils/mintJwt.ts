import { useRuntimeConfig } from 'nuxt/server'
import { signPostgrestJwt } from '../../shared/utils/serverCore'
import type { MintJwtClaims, MintJwtOptions } from '../../shared/utils/serverCore'

export type { MintJwtClaims, MintJwtOptions }

/**
 * Sign a PostgREST JWT (HS256) with `NUXT_POSTGREST_JWT_SECRET`, which must equal PostgREST's `jwt-secret`.
 * Server routes only.
 */
export function mintJwt(claims: MintJwtClaims, options: MintJwtOptions = {}): Promise<string> {
  return signPostgrestJwt(useRuntimeConfig().postgrestJwtSecret, claims, options)
}
