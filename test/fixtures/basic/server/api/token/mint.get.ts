// ?in=15m | ?in=90 (seconds) | ?at=<epoch ms>
export default defineEventHandler(async (event) => {
  const { in: lifetime, at } = getQuery(event) as { in?: string, at?: string }

  try {
    const token = await mintJwt({ role: 'authenticated', sub: 'probe' }, {
      ...(lifetime && { expiresIn: Number.isNaN(Number(lifetime)) ? lifetime : Number(lifetime) }),
      ...(at && { expiresAt: Number(at) }),
    })
    return { token }
  }
  catch (error) {
    return { error: (error as Error).message }
  }
})
