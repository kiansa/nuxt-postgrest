/** Name of the cookie that holds the user's PostgREST JWT. Fixed on purpose: nothing needs to change it. */
export const POSTGREST_TOKEN_COOKIE = 'nuxt_postgrest_token'

function decodeBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
  return new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0)))
}

/**
 * Read the `exp` claim (seconds since the epoch) from a JWT without verifying it.
 * Returns `undefined` when the token has no `exp` or can't be parsed.
 */
export function getJwtExpiry(token: string): number | undefined {
  const payload = token.split('.')[1]
  if (!payload) return undefined

  try {
    const { exp } = JSON.parse(decodeBase64Url(payload))
    return typeof exp === 'number' ? exp : undefined
  }
  catch {
    return undefined
  }
}

/**
 * The token if it looks like a JWT that has not expired, otherwise `undefined`,
 * so an expired cookie falls back to the anon key instead of failing with PGRST301.
 */
export function getUsableToken(token: string | null | undefined, now = Date.now()): string | undefined {
  if (!token || token.split('.').length !== 3) return undefined

  const exp = getJwtExpiry(token)
  if (exp !== undefined && exp * 1000 <= now) return undefined

  return token
}
