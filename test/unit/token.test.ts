import { describe, expect, it } from 'vitest'
import { getJwtExpiry, getUsableToken } from '../../src/runtime/shared/utils/token'

function jwt(claims: Record<string, unknown>) {
  const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${b64({ alg: 'HS256' })}.${b64(claims)}.signature`
}

const now = Date.now()
const inOneHour = Math.floor(now / 1000) + 3600
const anHourAgo = Math.floor(now / 1000) - 3600

describe('getJwtExpiry', () => {
  it('reads exp without verifying the signature', () => {
    expect(getJwtExpiry(jwt({ role: 'authenticated', exp: inOneHour }))).toBe(inOneHour)
  })

  it('returns undefined without exp or for malformed tokens', () => {
    expect(getJwtExpiry(jwt({ role: 'authenticated' }))).toBeUndefined()
    expect(getJwtExpiry('not-a-jwt')).toBeUndefined()
    expect(getJwtExpiry('a.%%%.c')).toBeUndefined()
  })

  it('handles non-ASCII claims', () => {
    expect(getJwtExpiry(jwt({ name: 'Zoë 日本', exp: inOneHour }))).toBe(inOneHour)
  })
})

describe('getUsableToken', () => {
  it('returns a token that has not expired', () => {
    const token = jwt({ exp: inOneHour })
    expect(getUsableToken(token, now)).toBe(token)
  })

  it('keeps a token that has no exp', () => {
    const token = jwt({ role: 'authenticated' })
    expect(getUsableToken(token, now)).toBe(token)
  })

  it('drops expired, empty and non-JWT values', () => {
    expect(getUsableToken(jwt({ exp: anHourAgo }), now)).toBeUndefined()
    expect(getUsableToken('', now)).toBeUndefined()
    expect(getUsableToken(null, now)).toBeUndefined()
    expect(getUsableToken('garbage', now)).toBeUndefined()
  })
})
