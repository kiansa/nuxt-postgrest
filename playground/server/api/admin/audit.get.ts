// Non-default schema via .schema() — sets Accept-Profile for you
export default defineEventHandler(async () => {
  const { data, error } = await db.schema('internal').from('audit_log').select('id, message')
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
