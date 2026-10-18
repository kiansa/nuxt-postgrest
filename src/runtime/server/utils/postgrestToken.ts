import type { RequestEvent } from 'nuxt/server'
import { deleteCookie, getRequestProtocol, setCookie } from 'nuxt/server'
import { tokenCookieOptions } from '../../shared/utils/serverCore'
import { POSTGREST_TOKEN_COOKIE } from '../../shared/utils/token'
import type { ServerEvent } from './serverEvent'

/**
 * Store the user's PostgREST JWT in the token cookie, so `usePostgrest()` (including after client-side
 * navigation) and `usePostgrestUser()` pick it up. Call it after your auth library signs the user in.
 *
 * The cookie is readable by the browser on purpose: browser-side queries need the token. It lives as long as the
 * token's `exp`, and is `Secure` whenever the request came in over HTTPS.
 */
export function setPostgrestToken(event: ServerEvent, token: string): void {
  // `nuxt/server` helpers are typed against `RequestEvent` but also run on h3 v1 events
  const requestEvent = event as RequestEvent
  const secure = getRequestProtocol(requestEvent, { xForwardedProto: true }) === 'https'

  setCookie(requestEvent, POSTGREST_TOKEN_COOKIE, token, tokenCookieOptions(token, secure))
}

/** Remove the token cookie, for example on logout. Requests then fall back to the anon key. */
export function clearPostgrestToken(event: ServerEvent): void {
  deleteCookie(event as RequestEvent, POSTGREST_TOKEN_COOKIE, { path: '/' })
}
