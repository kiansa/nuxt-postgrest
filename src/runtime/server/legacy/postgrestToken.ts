// Nuxt 4.0 to 4.5. See ../utils for the Nuxt 4.6+ version.
import { deleteCookie, getRequestProtocol, setCookie } from 'h3'
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
  const secure = getRequestProtocol(event, { xForwardedProto: true }) === 'https'

  setCookie(event, POSTGREST_TOKEN_COOKIE, token, tokenCookieOptions(token, secure))
}

/** Remove the token cookie, for example on logout. Requests then fall back to the anon key. */
export function clearPostgrestToken(event: ServerEvent): void {
  deleteCookie(event, POSTGREST_TOKEN_COOKIE, { path: '/' })
}
