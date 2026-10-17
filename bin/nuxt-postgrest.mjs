#!/usr/bin/env node
// nuxt-postgrest CLI. Plain Node, no build step: it is published as-is.
//
//   nuxt-postgrest types   Generate shared/types/database.types.ts from your database
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { parseArgs } from 'node:util'

const DEFAULT_PATH = 'shared/types/database.types.ts'
const DEFAULT_ENV_FILES = ['.env', '.env.local']

const HELP = `nuxt-postgrest

Usage
  nuxt-postgrest types [options]

Generates the Database type from your Postgres database with the Supabase CLI,
formats it with oxfmt, and lints it if your package.json has a "lint" script.
DATABASE_URL must be set in the environment or in an env file.

Options
  --schema <list>      Postgres schemas to include, comma separated (default: public)
  --path <file>        Where to write the types (default: ${DEFAULT_PATH})
  --env-file <file>    Env file holding DATABASE_URL (default: .env, then .env.local)
  --lint <command>     Command to fix the file, run with the path appended.
                       Default: the "lint" script in package.json, run with --fix.
                       Pass "false" to skip linting.
  -h, --help           Show this help
`

const windows = process.platform === 'win32'

// On Windows the package manager binaries are .cmd shims, which need a shell
function run(command, args, options = {}) {
  return spawnSync(command, args, { shell: windows, ...options })
}

function fail(message) {
  console.error(message)
  process.exit(1)
}

/** Read KEY=value pairs from an env file. Quotes around values are stripped. */
function parseEnv(contents) {
  const env = {}
  for (const line of contents.split(/\r?\n/)) {
    const index = line.indexOf('=')
    if (index === -1) continue
    const key = line.slice(0, index).replace(/^\s*export\s+/, '').trim()
    if (!/^\w+$/.test(key)) continue
    env[key] = line.slice(index + 1).trim().replace(/^(["'])(.*)\1$/, '$2')
  }
  return env
}

function findDatabaseUrl(envFile) {
  if (process.env.DATABASE_URL) {
    return { url: process.env.DATABASE_URL }
  }

  const candidates = envFile ? [envFile] : DEFAULT_ENV_FILES
  for (const file of candidates) {
    if (!existsSync(file)) continue
    const url = parseEnv(readFileSync(file, 'utf8')).DATABASE_URL
    if (url) return { url, file }
  }
  return { checked: candidates }
}

function readLintScript() {
  try {
    return JSON.parse(readFileSync('package.json', 'utf8')).scripts?.lint
  }
  catch {
    return undefined
  }
}

function parseTypesArgs(args) {
  try {
    return parseArgs({
      args,
      options: {
        'schema': { type: 'string', default: 'public' },
        'path': { type: 'string', default: DEFAULT_PATH },
        'env-file': { type: 'string' },
        'lint': { type: 'string' },
        'help': { type: 'boolean', short: 'h' },
      },
    }).values
  }
  catch (error) {
    return fail(`${error.message}

${HELP}`)
  }
}

function types(args) {
  const values = parseTypesArgs(args)

  if (values.help) {
    console.log(HELP)
    return
  }

  const found = findDatabaseUrl(values['env-file'])
  if (!found.url) {
    fail(`DATABASE_URL not found in the environment or in ${found.checked.join(' / ')}.\nAdd it, for example: DATABASE_URL=postgres://user:password@localhost:5432/postgres`)
  }

  // pnpx when pnpm is installed, npx otherwise
  const pnpm = run('pnpm', ['--version'], { stdio: 'ignore' }).status === 0
  const [dlx, ...dlxArgs] = pnpm ? ['pnpx'] : ['npx', '--yes']
  const output = values.path

  console.log(`Generating types for schema "${values.schema}"...`)
  const gen = run(
    dlx,
    [...dlxArgs, 'supabase@latest', 'gen', 'types', '--lang=typescript', '--db-url', windows ? `"${found.url}"` : found.url, '--schema', values.schema],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
  )

  // Never replace a good file with a failed or partial run
  const generated = gen.stdout ?? ''
  if (gen.status !== 0 || !generated.includes('export type Database')) {
    console.error(`Type generation failed; leaving ${output} unchanged.`)
    console.error(`${gen.stderr ?? ''}${generated}`.trim().slice(-800))
    fail('Check DATABASE_URL and that the database is reachable.')
  }

  mkdirSync(dirname(output), { recursive: true })
  writeFileSync(output, generated, 'utf8')

  const format = run(dlx, [...dlxArgs, 'oxfmt@latest', output], { stdio: 'inherit' })
  if (format.status !== 0) {
    console.warn('Formatting with oxfmt failed; the file is written but unformatted.')
  }

  let status = 0
  if (values.lint !== 'false') {
    if (values.lint) {
      status = run(`${values.lint} ${output}`, [], { stdio: 'inherit', shell: true }).status ?? 1
    }
    else if (readLintScript()) {
      // pnpm forwards extra args as-is; npm needs `--` to pass them on to the script
      const lintArgs = pnpm ? ['run', 'lint', '--fix', output] : ['run', 'lint', '--', '--fix', output]
      status = run(pnpm ? 'pnpm' : 'npm', lintArgs, { stdio: 'inherit' }).status ?? 1
    }
  }

  console.log(`Wrote ${output}`)
  process.exit(status)
}

const [command, ...rest] = process.argv.slice(2)

if (!command || command === '-h' || command === '--help') {
  console.log(HELP)
}
else if (command === 'types') {
  types(rest)
}
else {
  fail(`Unknown command "${command}".

${HELP}`)
}
