import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { jwtVerify } from 'jose'
import { describe, expect, it } from 'vitest'
import { createAdminClient, createUserClient, signPostgrestJwt, tokenCookieOptions } from '../../src/runtime/shared/utils/serverCore'

const SECRET = 'nuxt-postgrest-dev-secret-at-least-32-chars-long'
const seconds = (ms = Date.now()) => Math.floor(ms / 1000)

function jwt(claims: Record<string, unknown>) {
  const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${b64({ alg: 'HS256' })}.${b64(claims)}.signature`
}

const authorization = (client: unknown) => (client as { headers: Headers }).headers.get('authorization')

describe('signPostgrestJwt', () => {
  it('signs a token PostgREST can verify with the same secret', async () => {
    const token = await signPostgrestJwt(SECRET, { role: 'authenticated', sub: 'alice' })
    const { payload } = await jwtVerify(token, new TextEncoder().encode(SECRET))

    expect(payload).toMatchObject({ role: 'authenticated', sub: 'alice' })
    expect(payload.exp! - payload.iat!).toBe(3600)
  })

  it('takes seconds, a duration string or an absolute expiry', async () => {
    const lifetime = async (options: Parameters<typeof signPostgrestJwt>[2]) => {
      const { payload } = await jwtVerify(await signPostgrestJwt(SECRET, { role: 'r' }, options), new TextEncoder().encode(SECRET))
      return payload.exp! - payload.iat!
    }

    expect(await lifetime({ expiresIn: 90 })).toBe(90)
    expect(await lifetime({ expiresIn: '15m' })).toBe(900)

    const at = Date.now() + 2 * 3600 * 1000
    const { payload } = await jwtVerify(await signPostgrestJwt(SECRET, { role: 'r' }, { expiresAt: at, expiresIn: '15m' }), new TextEncoder().encode(SECRET))
    expect(payload.exp).toBe(seconds(at))
  })

  it('rejects a missing secret and an expiry in the past', async () => {
    await expect(signPostgrestJwt('', { role: 'r' })).rejects.toThrow('NUXT_POSTGREST_JWT_SECRET')
    await expect(signPostgrestJwt(SECRET, { role: 'r' }, { expiresAt: Date.now() - 1000 })).rejects.toThrow('in the past')
  })
})

describe('tokenCookieOptions', () => {
  const now = seconds()

  it('lasts as long as the token and is readable by the browser', () => {
    const options = tokenCookieOptions(jwt({ exp: now + 600 }), false, now)

    expect(options).toEqual({ path: '/', sameSite: 'lax', httpOnly: false, secure: false, maxAge: 600 })
  })

  it('passes Secure through', () => {
    expect(tokenCookieOptions(jwt({ exp: now + 60 }), true, now).secure).toBe(true)
  })

  it('has no maxAge for a token without exp', () => {
    expect(tokenCookieOptions(jwt({ role: 'authenticated' }), false, now)).not.toHaveProperty('maxAge')
  })

  it('refuses an expired token', () => {
    expect(() => tokenCookieOptions(jwt({ exp: now - 1 }), false, now)).toThrow('expired')
  })
})

describe('createUserClient', () => {
  const config = { url: 'http://localhost:3001', key: 'anon-key' }
  const cookie = jwt({ exp: seconds() + 600 })

  it('prefers the explicit token, then the cookie, then the anon key', () => {
    expect(authorization(createUserClient(config, cookie, { token: 'explicit' }))).toBe('Bearer explicit')
    expect(authorization(createUserClient(config, cookie))).toBe(`Bearer ${cookie}`)
    expect(authorization(createUserClient(config, undefined))).toBe('Bearer anon-key')
  })

  it('sends no Authorization header without a token or key', () => {
    expect(authorization(createUserClient({ ...config, key: '' }, undefined))).toBeNull()
  })

  it('ignores an expired cookie', () => {
    const expired = jwt({ exp: seconds() - 60 })
    expect(authorization(createUserClient(config, expired))).toBe('Bearer anon-key')
  })

  it('requires a URL', () => {
    expect(() => createUserClient({ url: '', key: '' }, undefined)).toThrow('NUXT_PUBLIC_POSTGREST_URL')
  })
})

describe('createAdminClient', () => {
  it('uses the secret key', () => {
    expect(authorization(createAdminClient('http://localhost:3001', 'service-key'))).toBe('Bearer service-key')
  })

  it('requires a URL and a secret key', () => {
    expect(() => createAdminClient('', 'key')).toThrow('NUXT_PUBLIC_POSTGREST_URL')
    expect(() => createAdminClient('http://localhost:3001', '')).toThrow('NUXT_POSTGREST_SECRET_KEY')
  })
})

// The server utilities exist twice: for Nuxt 4.6+ (`nuxt/server`) and for older Nuxt (h3). They must stay in step.
describe('server runtimes', () => {
  const exportsOf = (path: string) => [...readFileSync(resolve(__dirname, '../../src/runtime/server', path), 'utf8')
    .matchAll(/^export (?:async )?(?:function|const) (\w+)/gm)].map(match => match[1]).sort()

  for (const file of ['mintJwt', 'postgrestToken', 'usePostgrestAdmin', 'usePostgrestUser']) {
    it(`${file} exports the same functions in both`, () => {
      expect(exportsOf(`legacy/${file}.ts`)).toEqual(exportsOf(`utils/${file}.ts`))
      expect(exportsOf(`utils/${file}.ts`).length).toBeGreaterThan(0)
    })
  }

  it('the legacy runtime never imports nuxt/server, which older Nuxt does not have', () => {
    for (const file of ['mintJwt', 'postgrestToken', 'usePostgrestAdmin', 'usePostgrestUser', 'serverEvent']) {
      expect(readFileSync(resolve(__dirname, `../../src/runtime/server/legacy/${file}.ts`), 'utf8')).not.toMatch(/from ['"]nuxt\/server['"]/)
    }
  })
})
