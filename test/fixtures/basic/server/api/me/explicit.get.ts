// Explicit token wins over the cookie
export default defineEventHandler(async (event) => {
  const token = await mintJwt({ role: 'authenticated', sub: 'bob' })
  const { data, error } = await usePostgrestUser(event, { token }).from('todos').select('title').order('id')
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data.map(t => t.title)
})
