// Stands in for "any auth library signed the user in": mint a PostgREST JWT and store it in the cookie.
// ?as=alice picks the user, ?ttl=60 the lifetime in seconds.
export default defineEventHandler(async (event) => {
  const { as = 'alice', ttl } = getQuery(event) as { as?: string, ttl?: string }
  const token = await mintJwt({ role: 'authenticated', sub: as }, ttl ? { expiresIn: Number(ttl) } : {})
  setPostgrestToken(event, token)
  return { ok: true }
})
