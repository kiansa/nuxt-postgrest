// Usage: node scripts/typecheck.mjs <project-dir>...
// Runs vue-tsc against each generated Nuxt tsconfig (app, server, shared) of the given projects.
// Written in Node instead of an `sh -c` loop so it also runs on Windows.
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'

const projects = process.argv.slice(2)
if (projects.length === 0) {
  console.error('Usage: node scripts/typecheck.mjs <project-dir>...')
  process.exit(1)
}

const vueTsc = createRequire(import.meta.url).resolve('vue-tsc/bin/vue-tsc.js')

for (const project of projects) {
  for (const config of ['app', 'server', 'shared']) {
    const result = spawnSync(process.execPath, [vueTsc, '--noEmit', '-p', `${project}/.nuxt/tsconfig.${config}.json`], { stdio: 'inherit' })

    if (result.status !== 0) {
      console.error(`Type check failed: ${project} (${config})`)
      process.exit(result.status ?? 1)
    }
  }
}
