import type { H3Event } from 'h3'
import { deleteCookie, getRequestProtocol, setCookie } from 'h3'
import { POSTGREST_TOKEN_COOKIE, getJwtExpiry } from '../../shared/utils/token'

/**
 * Store the user's PostgREST JWT in the token cookie, so `usePostgrest()` (including after client-side
 * navigation) and `usePostgrestUser()` pick it up. Call it after your auth library signs the user in.
 *
 * The cookie is readable by the browser on purpose: browser-side queries need the token. It lives as long as the
 * token's `exp`, and is `Secure` whenever the request came in over HTTPS.
 */
export function setPostgrestToken(event: H3Event, token: string): void {
  const expiry = getJwtExpiry(token)
  const now = Math.floor(Date.now() / 1000)

  if (expiry !== undefined && expiry <= now) {
    throw new Error('[nuxt-postgrest] Refusing to store an expired token.')
  }

  setCookie(event, POSTGREST_TOKEN_COOKIE, token, {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure: getRequestProtocol(event, { xForwardedProto: true }) === 'https',
    ...(expiry !== undefined && { maxAge: expiry - now }),
  })
}

/** Remove the token cookie, for example on logout. Requests then fall back to the anon key. */
export function clearPostgrestToken(event: H3Event): void {
  deleteCookie(event, POSTGREST_TOKEN_COOKIE, { path: '/' })
}
