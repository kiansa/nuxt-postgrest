// The server logic that doesn't depend on any h3 / Nitro API, shared by the two server runtimes:
// `server/utils` (Nuxt 4.6+, helpers from `nuxt/server`) and `server/legacy` (Nuxt 4.0 to 4.5, helpers from `h3`).
import { SignJWT } from 'jose'
import type { JWTPayload } from 'jose'
import type { PostgrestClient } from '@supabase/postgrest-js'
import { createPostgrestClient } from './createPostgrestClient'
import { getJwtExpiry, getUsableToken } from './token'
import type { Database } from '#build/types/postgrest-database'

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

export interface UsePostgrestUserOptions {
  /** Explicit JWT. Takes precedence over the token cookie and the anon key. */
  token?: string
  /** Extra headers merged into every request. */
  headers?: Record<string, string>
}

export const MISSING_URL = '[nuxt-postgrest] Missing PostgREST URL. Set NUXT_PUBLIC_POSTGREST_URL or `runtimeConfig.public.postgrestUrl`.'

/** Sign a PostgREST JWT (HS256) with the configured secret. */
export async function signPostgrestJwt(secret: string | undefined, claims: MintJwtClaims, options: MintJwtOptions = {}): Promise<string> {
  if (!secret) {
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
    .sign(new TextEncoder().encode(secret))
}

/** The attributes for the token cookie. Throws for a token that has already expired. */
export function tokenCookieOptions(token: string, secure: boolean, now = Math.floor(Date.now() / 1000)) {
  const expiry = getJwtExpiry(token)

  if (expiry !== undefined && expiry <= now) {
    throw new Error('[nuxt-postgrest] Refusing to store an expired token.')
  }

  return {
    path: '/',
    sameSite: 'lax' as const,
    // Readable on purpose: browser-side queries after client-side navigation need the token
    httpOnly: false,
    secure,
    ...(expiry !== undefined && { maxAge: expiry - now }),
  }
}

/** The client for the requesting user: `options.token` → token cookie → anon key → no header. */
export function createUserClient(config: { url: string, key: string }, cookie: string | undefined, options: UsePostgrestUserOptions = {}): PostgrestClient<Database> {
  if (!config.url) {
    throw new Error(MISSING_URL)
  }

  return createPostgrestClient<Database>({
    url: config.url,
    key: options.token || getUsableToken(cookie) || config.key || undefined,
    headers: options.headers,
  }) as PostgrestClient<Database>
}

/** The privileged client. Each server runtime keeps its own singleton of it. */
export function createAdminClient(url: string, secretKey: string): PostgrestClient<Database> {
  if (!url) {
    throw new Error(MISSING_URL)
  }
  if (!secretKey) {
    throw new Error('[nuxt-postgrest] Missing NUXT_POSTGREST_SECRET_KEY for admin access.')
  }

  return createPostgrestClient<Database>({ url, key: secretKey }) as PostgrestClient<Database>
}
