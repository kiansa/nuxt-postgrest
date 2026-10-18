import { describe, expect, it, vi } from 'vitest'
import { createAuthorizedFetch } from '../../src/runtime/shared/utils/authorizedFetch'
import { readCookieValue } from '../../src/runtime/shared/utils/token'

function recorder() {
  const calls: { url: string, headers: Headers }[] = []
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(input), headers: new Headers(init?.headers) })
    return new Response('ok')
  }) as unknown as typeof globalThis.fetch
  return { calls, fetch }
}

describe('createAuthorizedFetch', () => {
  it('sets Authorization from the current token', async () => {
    const { calls, fetch } = recorder()
    const send = createAuthorizedFetch({ getToken: () => 'abc', fetch })

    await send('http://x/todos')

    expect(calls[0]!.headers.get('authorization')).toBe('Bearer abc')
  })

  it('reads the token again on every request', async () => {
    const { calls, fetch } = recorder()
    let token: string | undefined
    const send = createAuthorizedFetch({ getToken: () => token, fetch })

    await send('http://x/todos')
    token = 'after-login'
    await send('http://x/todos')
    token = undefined
    await send('http://x/todos')

    expect(calls.map(call => call.headers.get('authorization'))).toEqual([null, 'Bearer after-login', null])
  })

  it('replaces an Authorization header added by the client', async () => {
    const { calls, fetch } = recorder()
    const send = createAuthorizedFetch({ getToken: () => 'fresh', fetch })

    await send('http://x/todos', { headers: { Authorization: 'Bearer stale' } })

    expect(calls[0]!.headers.get('authorization')).toBe('Bearer fresh')
  })

  it('removes a stale Authorization header when there is no token', async () => {
    const { calls, fetch } = recorder()
    const send = createAuthorizedFetch({ getToken: () => undefined, fetch })

    await send('http://x/todos', { headers: { Authorization: 'Bearer stale' } })

    expect(calls[0]!.headers.has('authorization')).toBe(false)
  })

  it('leaves the request alone when the caller set Authorization on purpose', async () => {
    const { calls, fetch } = recorder()
    const send = createAuthorizedFetch({ getToken: () => 'ignored', keepAuthorization: true, fetch })

    await send('http://x/todos', { headers: { Authorization: 'Bearer mine' } })

    expect(calls[0]!.headers.get('authorization')).toBe('Bearer mine')
  })

  it('keeps the other headers and request options', async () => {
    const { calls, fetch } = recorder()
    const send = createAuthorizedFetch({ getToken: () => 'abc', fetch })

    await send('http://x/todos', { method: 'POST', headers: { 'Content-Type': 'application/json' } })

    expect(calls[0]!.headers.get('content-type')).toBe('application/json')
    expect(vi.mocked(fetch).mock.calls[0]![1]!.method).toBe('POST')
  })
})

describe('readCookieValue', () => {
  it('finds a cookie among others', () => {
    expect(readCookieValue('a=1; nuxt_postgrest_token=abc.def.ghi; b=2', 'nuxt_postgrest_token')).toBe('abc.def.ghi')
  })

  it('decodes encoded values', () => {
    expect(readCookieValue('t=a%20b', 't')).toBe('a b')
  })

  it('returns undefined for a missing cookie or an empty string', () => {
    expect(readCookieValue('a=1', 'b')).toBeUndefined()
    expect(readCookieValue('', 'b')).toBeUndefined()
  })

  it('treats a malformed cookie as absent instead of throwing', () => {
    expect(readCookieValue('t=%E0%A4%A', 't')).toBeUndefined()
  })

  it('does not match a cookie whose name only ends the same way', () => {
    expect(readCookieValue('other_nuxt_postgrest_token=x', 'nuxt_postgrest_token')).toBeUndefined()
  })
})
