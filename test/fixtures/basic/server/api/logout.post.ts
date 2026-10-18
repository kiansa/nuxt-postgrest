export default defineEventHandler((event) => {
  clearPostgrestToken(event)
  return { ok: true }
})
