import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

const cli = resolve(__dirname, '../../bin/nuxt-postgrest.mjs')

let cwd: string

beforeEach(() => {
  cwd = mkdtempSync(join(tmpdir(), 'nuxt-postgrest-cli-'))
})

afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

function run(...args: string[]) {
  const env = { ...process.env }
  delete env.DATABASE_URL
  return spawnSync(process.execPath, [cli, ...args], { cwd, env, encoding: 'utf8' })
}

describe('nuxt-postgrest CLI', () => {
  it('prints help without a command', () => {
    const result = run()
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('nuxt-postgrest types')
  })

  it('documents every flag', () => {
    const { stdout } = run('types', '--help')
    for (const flag of ['--schema', '--path', '--env-file', '--lint']) {
      expect(stdout).toContain(flag)
    }
    expect(stdout).toContain('shared/types/database.types.ts')
  })

  it('rejects unknown commands', () => {
    const result = run('nope')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Unknown command "nope"')
  })

  it('fails when DATABASE_URL is missing, naming the default env files', () => {
    const result = run('types')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('DATABASE_URL not found')
    expect(result.stderr).toContain('.env / .env.local')
  })

  it('does not fall back to .env when --env-file points elsewhere', () => {
    writeFileSync(join(cwd, '.env'), 'DATABASE_URL=postgres://example\n')
    const result = run('types', '--env-file', 'other.env')
    // Node itself rejects a missing --env-file; either way it must not use .env
    expect(result.status).not.toBe(0)
    expect(result.stderr).toContain('other.env')
  })

  it('reports unknown flags', () => {
    const result = run('types', '--nope')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('--nope')
  })
})
