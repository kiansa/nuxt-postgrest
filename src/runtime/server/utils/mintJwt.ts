import { SignJWT } from 'jose'
import type { JWTPayload } from 'jose'
import { useRuntimeConfig } from '#imports'

export interface MintJwtClaims extends JWTPayload {
  /** Postgres role PostgREST switches to for this token, e.g. `authenticated`. */
  role: string
}

export interface MintJwtOptions {
  /** Lifetime as a duration string like `'15m'`, `'1h'` or `'7d'`, or a number of seconds. Defaults to `'1h'`. */
  expiresIn?: string | number
  /** Absolute expiry, for example your auth session's `expiresAt`. Wins over `expiresIn`. */
  expiresAt?: Date | number
}

/**
 * Sign a PostgREST JWT (HS256) with `NUXT_POSTGREST_JWT_SECRET`, which must equal PostgREST's `jwt-secret`.
 * Server routes only.
 */
export async function mintJwt(claims: MintJwtClaims, options: MintJwtOptions = {}): Promise<string> {
  const { postgrestJwtSecret: jwtSecret } = useRuntimeConfig()

  if (!jwtSecret) {
    throw new Error('[nuxt-postgrest] Missing NUXT_POSTGREST_JWT_SECRET. It must equal PostgREST\'s jwt-secret.')
  }

  const now = Math.floor(Date.now() / 1000)
  let expiration: string | number

  if (options.expiresAt !== undefined) {
    expiration = Math.floor(new Date(options.expiresAt).getTime() / 1000)
    if (!(expiration > now)) {
      throw new Error('[nuxt-postgrest] `expiresAt` is in the past.')
    }
  }
  else {
    const { expiresIn = '1h' } = options
    // jose treats a number as an absolute time, so turn a number of seconds into one
    expiration = typeof expiresIn === 'number' ? now + expiresIn : expiresIn
  }

  return new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(new TextEncoder().encode(jwtSecret))
}
