// User client: RLS applies as the logged-in user (token read from the cookie)
export default defineEventHandler(async (event) => {
  const { data, error } = await usePostgrestUser(event).from('todos').select('*').order('id')
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
