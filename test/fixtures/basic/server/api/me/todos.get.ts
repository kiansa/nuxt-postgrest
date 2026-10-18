export default defineEventHandler(async (event) => {
  const { data, error } = await usePostgrestUser(event).from('todos').select('title').order('id')
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data.map(t => t.title)
})
