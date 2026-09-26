# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## What this is

A Nuxt module (`nuxt-postgrest`) that wraps `@supabase/postgrest-js` to give Nuxt apps typed PostgREST clients, SSR-aware composables, and auth-aware JWT forwarding — without requiring Supabase hosting.

## Commands

```bash
pnpm db:up            # start local Postgres + PostgREST (docker-compose) — required for tests
pnpm db:down          # stop and wipe the local database
pnpm dev              # playground app with live-reloading, at localhost:3000

pnpm lint             # eslint .
pnpm test             # unit + e2e (needs pnpm db:up)
pnpm test:unit        # vitest --project unit only (no PostgREST needed)
pnpm test:e2e         # vitest --project e2e only (needs pnpm db:up)
pnpm test:watch       # vitest watch
pnpm test:types       # compile-time checks in playground/ and test/fixtures/basic/
```

To run a single test file: `vitest run test/unit/createPostgrestClient.test.ts` (or any path under `test/e2e/`). The module requires Nuxt 4+; CI also runs a nightly job against `nuxt@latest`.

Before opening a PR: `pnpm lint`, `pnpm test`, `pnpm test:types` (see CONTRIBUTING.md).

## Architecture

```
src/module.ts                module definition, runtime config, type-gen hook, nuxt-auth-utils detection
src/runtime/shared/          createPostgrestClient — the one place a PostgrestClient is constructed
src/runtime/app/             usePostgrest (client & SSR)
src/runtime/server/          usePostgrestUser, usePostgrestAdmin (Nitro only)
playground/                  manual testing app — full login flow, RLS, admin & schema examples
test/unit/                   pure-logic tests (no PostgREST needed)
test/e2e/                    @nuxt/test-utils tests against test/fixtures/basic, real PostgREST
docs/                        Docus documentation site (separate pnpm workspace package)
db/seed.sql, docker-compose.yml, docker-compose.postgrest.yml   local Postgres + PostgREST used by dev, tests and CI
```

**Auth is codegen, not an adapter architecture.** There is no pluggable-provider system and no `runtime/*/auth/` directories. `nuxt-auth-utils` is the one library the module knows about, detected once via `hasNuxtModule('nuxt-auth-utils', nuxt)` in `setup()`. That boolean decides the *contents* `module.ts` writes into two `addTemplate`-generated files:

- `postgrest-token-app.ts` (aliased to `#postgrest-token/app`, imported by `usePostgrest`) — real code reading `session.value[tokenKey]` via `useUserSession` when detected, otherwise a one-line stub returning `undefined`.
- `postgrest-token-server.ts` (aliased to `#postgrest-token/server`, imported by `usePostgrestUser`) — same idea, async, via `getUserSession(event)`.

This exists because a static top-level `import { useUserSession } from '#imports'` in a published module's runtime would break the build for any app without `nuxt-auth-utils` installed — that auto-import wouldn't exist for them. Generating the file's *content* conditionally, once, at build time, avoids that without needing a per-provider file/alias system. Both files are written with `addTemplate({ write: true })` into the Nuxt build dir, then aliased with `nuxt.options.alias` rather than imported via the usual `#build/*` path — Nitro's `impound` plugin blocks `#build/*` from server code (reserved for the Vue app build), so the server template needs its own alias pointing at the same physical file. Every other auth library is explicitly out of scope: users read their own session however their library exposes it and pass the token to `usePostgrest({ token })` / `usePostgrestUser(event, { token })` themselves — don't reintroduce a provider abstraction for this.

**Client construction funnels through one function.** `src/runtime/shared/utils/createPostgrestClient.ts` is the only place a `PostgrestClient` gets built; `usePostgrest`, `usePostgrestUser`, and `usePostgrestAdmin` are all thin wrappers around it that differ only in *which token* they resolve and *where* (client/SSR app context vs. Nitro server routes vs. a cached admin singleton).

**Token resolution order** (`usePostgrest` / `usePostgrestUser`): explicit `options.token` → session token via the generated `postgrest-token-*` file above → public anon key from module config → no `Authorization` header. `usePostgrestAdmin` instead always uses the server-only `NUXT_POSTGREST_SECRET_KEY` and bypasses RLS if that role does; its client is memoized as a module-level singleton.

**Database types.** Types come from a generated `Database` type file (fixed path `~~/shared/types/database.types.ts`, not configurable), re-exported through a Nitro template at `#build/types/postgrest-database`. If `generateTypes` is enabled, `module.ts`'s `generateTypes()` shells out to the Supabase CLI (`npx supabase gen types typescript --db-url ... --schema public`) on `nuxt dev`/`nuxt prepare` (never on build), gated on `NUXT_POSTGREST_DB_URI` being set and Docker running. It uses `execFileSync` (not a shell string) specifically so the connection URI can't be used for command injection — preserve that when touching this code. A failed/partial generation never overwrites the existing types file. Automatic generation only covers `public`; other schemas need a manual `supabase gen types` run with an explicit `--schema` list (see `docs/content/2.guide/4.types.md`).

**Schema handling.** There's no module-level schema option — `usePostgrest`/`usePostgrestUser`/`usePostgrestAdmin` always target `public`. `SchemaKeys<DB>`/`DefaultSchema<DB>` in `createPostgrestClient.ts` derive the available Postgres schemas directly from the generated `Database` type, so calling `createPostgrestClient<Database, 'schema_name'>({ ..., schema: 'schema_name' })` (or `.schema('schema_name')` on any client) for multi-schema/per-tenant use stays fully typed.

## Release process

`pnpm release` bumps the version via `changelogen` (reads conventional commits since the last tag — `fix:`/`feat:`/a `BREAKING CHANGE:` footer decide patch/minor/major), runs the full local check suite and real build, commits, tags, and pushes. The pushed tag triggers `.github/workflows/release.yml`, which re-runs the checks in CI and publishes to npm via trusted publishing (OIDC) — no token stored anywhere, nothing to rotate. New versions then sit in npm's automated security review for a few minutes ("Validating" on npm) before becoming installable; that's expected.

This publishes publicly and pushes real tags/commits to the actual repo — treat it like any other irreversible, external-effect action. Don't run `pnpm release` unless explicitly asked to.

## Testing notes

- `test/unit/` needs no live services.
- `test/e2e/` and the `playground/` both run against real Postgres + PostgREST started by `pnpm db:up` (`docker-compose.yml` for Postgres, `docker-compose.postgrest.yml` for PostgREST — separate files since one Postgres instance can back any number of PostgREST instances/databases; `pnpm db:up`/`db:down` merge both via `-f`). Seeded by `db/seed.sql`. e2e tests build/mount `test/fixtures/basic`, a minimal Nuxt app with a login route, an admin route, and RLS-scoped `me/*` routes exercising each composable.
- `pnpm pretest` runs `nuxt prepare test/fixtures/basic` automatically before `vitest run`.
