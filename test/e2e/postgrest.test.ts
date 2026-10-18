import { fileURLToPath } from 'node:url'
import { createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'

// Requires a running PostgREST with db/seed.sql (`pnpm db:up`, or the CI service containers)
const POSTGREST_URL = process.env.POSTGREST_URL || 'http://localhost:3001'
const JWT_SECRET = process.env.PGRST_JWT_SECRET || 'nuxt-postgrest-dev-secret-at-least-32-chars-long'

function sign(claims: Record<string, unknown>) {
  const b64 = (s: string) => Buffer.from(s).toString('base64url')
  const h = b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const p = b64(JSON.stringify(claims))
  return `${h}.${p}.${createHmac('sha256', JWT_SECRET).update(`${h}.${p}`).digest('base64url')}`
}

process.env.NUXT_POSTGREST_SECRET_KEY = sign({ role: 'service_role' })
process.env.NUXT_POSTGREST_JWT_SECRET = JWT_SECRET

const reachable = await globalThis.fetch(POSTGREST_URL).then(() => true, () => false)
if (!reachable && process.env.CI) {
  throw new Error(`PostgREST is not reachable at ${POSTGREST_URL}`)
}

async function login(query: string) {
  const res = await fetch(`/api/login?${query}`, { method: 'POST' })
  const setCookie = res.headers.get('set-cookie') ?? ''
  expect(setCookie).toContain('nuxt_postgrest_token=')
  return { setCookie, cookie: setCookie.split(';')[0]! }
}

describe.skipIf(!reachable)('nuxt-postgrest (e2e)', async () => {
  await setup({
    rootDir: fileURLToPath(new URL('../fixtures/basic', import.meta.url)),
  })

  it('anonymous requests only see public rows (RLS as anon)', async () => {
    expect(await $fetch('/api/me/todos')).toEqual(['Public todo'])
  })

  it('usePostgrestUser forwards the token cookie', async () => {
    const { cookie } = await login('as=alice')
    expect(await $fetch('/api/me/todos', { headers: { cookie } })).toEqual(['Public todo', 'Alice private todo'])
  })

  it('setPostgrestToken writes a browser-readable cookie that lasts as long as the token', async () => {
    const { setCookie } = await login('as=alice')
    expect(setCookie).not.toMatch(/httponly/i)
    expect(setCookie).toMatch(/samesite=lax/i)
    expect(setCookie).toContain('Path=/')
    // mintJwt defaults to 1h
    const maxAge = Number(/max-age=(\d+)/i.exec(setCookie)?.[1])
    expect(maxAge).toBeGreaterThan(3500)
    expect(maxAge).toBeLessThanOrEqual(3600)
  })

  it('mintJwt honours expiresIn', async () => {
    const { setCookie } = await login('as=alice&ttl=120')
    const maxAge = Number(/max-age=(\d+)/i.exec(setCookie)?.[1])
    expect(maxAge).toBeGreaterThan(100)
    expect(maxAge).toBeLessThanOrEqual(120)
  })

  it('an expired token cookie is ignored instead of failing', async () => {
    const expired = sign({ role: 'authenticated', sub: 'alice', exp: Math.floor(Date.now() / 1000) - 60 })
    expect(await $fetch('/api/me/todos', { headers: { cookie: `nuxt_postgrest_token=${expired}` } })).toEqual(['Public todo'])
  })

  describe('mintJwt', () => {
    const claims = (token: string) => JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString())
    const seconds = (ms = Date.now()) => Math.floor(ms / 1000)

    it('defaults to one hour and signs the claims', async () => {
      const { token } = await $fetch<{ token: string }>('/api/token/mint')
      const payload = claims(token)
      expect(payload).toMatchObject({ role: 'authenticated', sub: 'probe' })
      expect(payload.exp - payload.iat).toBe(3600)
    })

    it('takes a duration string or seconds', async () => {
      const minutes = await $fetch<{ token: string }>('/api/token/mint?in=15m')
      expect(claims(minutes.token).exp - claims(minutes.token).iat).toBe(900)

      const secondsOnly = await $fetch<{ token: string }>('/api/token/mint?in=90')
      expect(claims(secondsOnly.token).exp - claims(secondsOnly.token).iat).toBe(90)
    })

    it('uses an absolute expiry, which wins over expiresIn', async () => {
      const at = Date.now() + 2 * 3600 * 1000
      const { token } = await $fetch<{ token: string }>(`/api/token/mint?at=${at}&in=15m`)
      expect(claims(token).exp).toBe(seconds(at))
    })

    it('rejects an expiry in the past', async () => {
      const { error } = await $fetch<{ error: string }>(`/api/token/mint?at=${Date.now() - 60_000}`)
      expect(error).toContain('in the past')
    })

    it('produces a token PostgREST accepts', async () => {
      const { token } = await $fetch<{ token: string }>('/api/token/mint')
      const res = await globalThis.fetch(`${POSTGREST_URL}/todos`, { headers: { Authorization: `Bearer ${token}` } })
      expect(res.status).toBe(200)
    })
  })

  describe('setPostgrestToken', () => {
    it('refuses to store an expired token', async () => {
      const expired = sign({ role: 'authenticated', exp: Math.floor(Date.now() / 1000) - 60 })
      const res = await $fetch<{ error: string }>(`/api/token/store?token=${expired}`, { method: 'POST' })
      expect(res.error).toContain('expired')
    })

    it('marks the cookie Secure only for HTTPS requests', async () => {
      const plain = await fetch('/api/login', { method: 'POST' })
      expect(plain.headers.get('set-cookie')).not.toMatch(/;\s*secure/i)

      const proxied = await fetch('/api/login', { method: 'POST', headers: { 'x-forwarded-proto': 'https' } })
      expect(proxied.headers.get('set-cookie')).toMatch(/;\s*secure/i)
    })
  })

  it('clearPostgrestToken removes the cookie', async () => {
    const res = await fetch('/api/logout', { method: 'POST' })
    const setCookie = res.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('nuxt_postgrest_token=;')
    expect(setCookie).toMatch(/max-age=0/i)
  })

  it('an explicit token overrides the cookie', async () => {
    const { cookie } = await login('as=alice')
    expect(await $fetch('/api/me/explicit', { headers: { cookie } })).toEqual(['Public todo', 'Bob private todo'])
  })

  it('usePostgrestAdmin bypasses RLS', async () => {
    expect(await $fetch('/api/admin/todos')).toEqual(['Public todo', 'Alice private todo', 'Bob private todo'])
  })

  it('targets non-default schemas via .schema() and createPostgrestClient({ schema })', async () => {
    expect(await $fetch('/api/admin/audit')).toEqual({ viaSchemaMethod: ['seeded'], viaFactory: ['seeded'] })
  })

  it('usePostgrest renders user data during SSR', async () => {
    const anon = await $fetch<string>('/')
    expect(anon).toContain('Public todo')
    expect(anon).not.toContain('Alice private todo')

    const { cookie } = await login('as=alice')
    const html = await $fetch<string>('/', { headers: { cookie } })
    expect(html).toContain('Alice private todo')
    expect(html).not.toContain('Bob private todo')
  })
})
