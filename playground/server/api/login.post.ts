// Demo only. Any auth library fits here: sign the user in with it, then store a PostgREST JWT for them.
export default defineEventHandler(async (event) => {
  // 1. Your auth library (nuxt-auth-utils in this playground)
  await setUserSession(event, { user: { name: 'alice' } })

  // 2. A PostgREST JWT for that user, in the cookie usePostgrest() reads, so
  //    queries run as them after client-side navigation too.
  const token = await mintJwt({ role: 'authenticated', sub: 'alice' }, { expiresIn: useRuntimeConfig(event).session.maxAge })
  setPostgrestToken(event, token)

  return { ok: true }
})
