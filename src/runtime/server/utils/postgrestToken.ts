import type { RequestEvent } from 'nuxt/server'
import { deleteCookie, getRequestProtocol, setCookie } from 'nuxt/server'
import type { ServerEvent } from '../../shared/types'
import { POSTGREST_TOKEN_COOKIE, getJwtExpiry } from '../../shared/utils/token'

/**
 * Store the user's PostgREST JWT in the token cookie, so `usePostgrest()` (including after client-side
 * navigation) and `usePostgrestUser()` pick it up. Call it after your auth library signs the user in.
 *
 * The cookie is readable by the browser on purpose: browser-side queries need the token. It lives as long as the
 * token's `exp`, and is `Secure` whenever the request came in over HTTPS.
 */
export function setPostgrestToken(event: ServerEvent, token: string): void {
  const expiry = getJwtExpiry(token)
  const now = Math.floor(Date.now() / 1000)

  if (expiry !== undefined && expiry <= now) {
    throw new Error('[nuxt-postgrest] Refusing to store an expired token.')
  }

  // `nuxt/server` helpers are typed against `RequestEvent` but also run on h3 v1 events
  const requestEvent = event as RequestEvent

  setCookie(requestEvent, POSTGREST_TOKEN_COOKIE, token, {
    path: '/',
    sameSite: 'lax',
    httpOnly: false,
    secure: getRequestProtocol(requestEvent, { xForwardedProto: true }) === 'https',
    ...(expiry !== undefined && { maxAge: expiry - now }),
  })
}

/** Remove the token cookie, for example on logout. Requests then fall back to the anon key. */
export function clearPostgrestToken(event: ServerEvent): void {
  deleteCookie(event as RequestEvent, POSTGREST_TOKEN_COOKIE, { path: '/' })
}
