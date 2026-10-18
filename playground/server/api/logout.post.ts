export default defineEventHandler(async (event) => {
  await clearUserSession(event)
  clearPostgrestToken(event)
  return { ok: true }
})
