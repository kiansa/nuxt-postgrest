import { spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
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

// The success path needs the Supabase CLI and a database. These tests put fake `npx` / `npm` executables first on
// PATH, so the CLI runs end to end without a network.
describe('nuxt-postgrest types (with fake package runners)', () => {
  const DATABASE_URL = 'postgres://user:pw@localhost:5432/app?sslmode=disable'
  let shims: string

  beforeEach(() => {
    shims = join(cwd, '.shims')
    mkdirSync(shims)

    writeFileSync(join(shims, 'fake.mjs'), `
      import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
      const [tool, ...args] = process.argv.slice(2)
      appendFileSync(process.env.FAKE_LOG, JSON.stringify({ tool, args }) + '\\n')
      if (args.includes('gen')) {
        if (process.env.FAKE_FAIL) { console.error('connection refused'); process.exit(1) }
        console.log('export type Database = { public: { Tables: {} } }')
      }
      else if (args.some(arg => arg.startsWith('oxfmt'))) {
        const file = args.at(-1)
        writeFileSync(file, readFileSync(file, 'utf8') + '// formatted\\n')
      }
    `)

    for (const tool of ['npx', 'npm']) {
      writeFileSync(join(shims, `${tool}.cmd`), `@echo off\r\n"${process.execPath}" "${join(shims, 'fake.mjs')}" ${tool} %*\r\n`)
      writeFileSync(join(shims, tool), `#!/bin/sh\nexec "${process.execPath}" "${join(shims, 'fake.mjs')}" ${tool} "$@"\n`)
      chmodSync(join(shims, tool), 0o755)
    }
  })

  function types(args: string[], extraEnv: Record<string, string> = {}) {
    const env: Record<string, string | undefined> = Object.fromEntries(
      Object.entries(process.env).filter(([key]) => key.toLowerCase() !== 'path'),
    )
    // Only the shims, so no real pnpm is found and the CLI takes its npx path
    env.PATH = shims
    env.DATABASE_URL = DATABASE_URL
    env.FAKE_LOG = join(cwd, 'calls.log')

    const result = spawnSync(process.execPath, [cli, 'types', ...args], { cwd, env: { ...env, ...extraEnv }, encoding: 'utf8' })
    const calls = existsSync(env.FAKE_LOG)
      ? readFileSync(env.FAKE_LOG, 'utf8').trim().split('\n').filter(Boolean).map(line => JSON.parse(line) as { tool: string, args: string[] })
      : []
    return { ...result, calls }
  }

  it('generates, formats and writes the file', () => {
    const result = types(['--path', 'out/db.ts', '--schema', 'public,auth', '--lint', 'false'])

    expect(result.status).toBe(0)
    const file = readFileSync(join(cwd, 'out/db.ts'), 'utf8')
    expect(file).toContain('export type Database')
    expect(file).toContain('// formatted')

    const generate = result.calls.find(call => call.args.includes('gen'))!
    expect(generate.args).toContain('supabase@latest')
    expect(generate.args).toContain('public,auth')
    expect(generate.args.join(' ')).toContain('postgres://user:pw@localhost:5432/app?sslmode=disable')
    expect(generate.args).toContain('--yes')
  })

  it('never overwrites the existing file when generation fails', () => {
    mkdirSync(join(cwd, 'out'))
    writeFileSync(join(cwd, 'out/db.ts'), 'KEEP ME')

    const result = types(['--path', 'out/db.ts', '--lint', 'false'], { FAKE_FAIL: '1' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('leaving out/db.ts unchanged')
    expect(readFileSync(join(cwd, 'out/db.ts'), 'utf8')).toBe('KEEP ME')
  })

  it('reads DATABASE_URL from .env.local when .env does not have it', () => {
    writeFileSync(join(cwd, '.env'), 'OTHER=1\n')
    writeFileSync(join(cwd, '.env.local'), 'DATABASE_URL="postgres://from-env-local/db"\n')

    const result = types(['--path', 'db.ts', '--lint', 'false'], { DATABASE_URL: '' })

    expect(result.status).toBe(0)
    const generate = result.calls.find(call => call.args.includes('gen'))!
    expect(generate.args.join(' ')).toContain('postgres://from-env-local/db')
  })

  it('runs the lint script with --fix on the file when package.json has one', () => {
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ scripts: { lint: 'eslint .' } }))

    const result = types(['--path', 'db.ts'])

    expect(result.status).toBe(0)
    const lint = result.calls.find(call => call.tool === 'npm')!
    expect(lint.args).toEqual(['run', 'lint', '--', '--fix', 'db.ts'])
  })

  it('skips linting with --lint false, and when there is no lint script', () => {
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ scripts: { lint: 'eslint .' } }))
    expect(types(['--path', 'db.ts', '--lint', 'false']).calls.some(call => call.tool === 'npm')).toBe(false)

    rmSync(join(cwd, 'calls.log'), { force: true })
    writeFileSync(join(cwd, 'package.json'), JSON.stringify({ scripts: {} }))
    expect(types(['--path', 'db.ts']).calls.some(call => call.tool === 'npm')).toBe(false)
  })
})
