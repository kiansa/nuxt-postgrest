// ?token=<jwt>: tries to store it, reports why not
export default defineEventHandler((event) => {
  const { token } = getQuery(event) as { token: string }

  try {
    setPostgrestToken(event, token)
    return { ok: true }
  }
  catch (error) {
    return { error: (error as Error).message }
  }
})
