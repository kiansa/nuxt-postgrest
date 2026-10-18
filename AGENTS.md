# AGENTS.md

This file provides guidance to AI coding agents when working with code in this repository.

## What this is

A Nuxt module (`nuxt-postgrest`) that wraps `@supabase/postgrest-js` to give Nuxt apps typed PostgREST clients, SSR-aware composables, and auth-aware JWT forwarding — without requiring Supabase hosting.

## Commands

```bash
pnpm db:up            # start local Postgres + PostgREST (docker-compose) — required for tests
pnpm db:down          # stop and wipe the local database
pnpm dev              # playground app with live-reloading, at localhost:3000
pnpm docs:dev         # docs site, at localhost:3002/nuxt-postgrest/ (3001 is PostgREST)

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
src/module.ts                module definition: runtime config defaults, Database type template, server auto-imports (no module options)
src/runtime/shared/          createPostgrestClient — the one place a PostgrestClient is constructed
src/runtime/app/             usePostgrest (client & SSR)
src/runtime/server/          usePostgrestUser, usePostgrestAdmin (Nitro only)
bin/nuxt-postgrest.mjs        published CLI (`nuxt-postgrest types`): plain Node, no build step, listed in package.json `bin` + `files`
playground/                  manual testing app — full login flow, RLS, admin & schema examples
test/unit/                   pure-logic tests (no PostgREST needed)
test/e2e/                    @nuxt/test-utils tests against test/fixtures/basic, real PostgREST
docs/                        Docus documentation site (separate pnpm workspace package)
db/seed.sql, docker-compose.yml, docker-compose.postgrest.yml   local Postgres + PostgREST used by dev, tests and CI
```

**Auth is a cookie, not an adapter architecture.** The module knows no auth library. The app signs users in with whatever library it likes, then calls the server auto-imports `mintJwt(claims, { expiresIn | expiresAt })` (HS256 via `jose`, signed with `NUXT_POSTGREST_JWT_SECRET`, which must equal PostgREST's `jwt-secret`) and `setPostgrestToken(event, jwt)` / `clearPostgrestToken(event)` (`src/runtime/server/utils/`). The cookie (`nuxt_postgrest_token`, the `POSTGREST_TOKEN_COOKIE` constant in `shared/utils/token.ts`, deliberately not configurable) holds the raw JWT: `Max-Age` from its `exp`, `SameSite=Lax`, `Secure` over HTTPS, and deliberately **not** `HttpOnly`, because browser-side `usePostgrest()` after client-side navigation needs it. `src/runtime/shared/utils/token.ts` decodes `exp` without verifying and `getUsableToken()` drops expired/malformed values so they fall back to the anon key instead of PGRST301. In the browser `usePostgrest()` reads `document.cookie` inside a custom `fetch` on every request (so clients created once in stores/plugins never go stale); during SSR it reads the request cookie once via `useCookie`. `usePostgrestUser` reads it with `getCookie`. There is no refresh mechanism, no encryption of the cookie, and no per-library adapter: don't reintroduce a provider abstraction. Library-specific recipes live in the docs.

**Two server runtimes, one core.** The server logic that needs no h3/Nitro API (signing, cookie attributes, token resolution, client construction) lives in `src/runtime/shared/utils/serverCore.ts`. The thin wrappers exist twice, and `module.ts` registers one set with `addServerImports` based on `getNuxtVersion()`: `src/runtime/server/utils/` for Nuxt 4.6+ (helpers from `nuxt/server`, the portable surface that also works on Nuxt 5 / Nitro v3, never `h3`/`nitropack`/`#imports`) and `src/runtime/server/legacy/` for Nuxt 4.0 to 4.5 (helpers from `h3` and `#imports`). Keep both wrapper sets and their public signatures identical. In the portable set `event` is `ServerEvent` (`RequestEvent | H3Event`, the h3 import is type-only) because Nitro v2 passes `H3Event` while Nitro v3 passes `RequestEvent`, and the helpers are called with `event as RequestEvent`. `nuxt` is a peer dependency (`>=4.0.0`, also `meta.compatibility`). Verified in clean, strict-pnpm consumer apps (packed tarball) on Nuxt 4.0.0, 4.1.0, 4.2.2, 4.3.1, 4.4.8, 4.5.2 and 4.6.1; CI runs the full suite on the locked Nuxt and exactly 4.0.0, which covers the legacy set, and the portable set runs on the locked Nuxt. Nuxt 4.6.0 fails to SSR even a plain page, independent of this module. `pnpm test:types` only works on Nuxt 4.6+ because the repo type-checks both sets from source; consumers are unaffected (checked with `nuxt typecheck` on 4.0.0). Nuxt 5 is not on npm yet, so it is not verified; keep the nightly job.

**Client construction funnels through one function.** `src/runtime/shared/utils/createPostgrestClient.ts` is the only place a `PostgrestClient` gets built; `usePostgrest`, `usePostgrestUser`, and `usePostgrestAdmin` are all thin wrappers around it that differ only in *which token* they resolve and *where* (client/SSR app context vs. Nitro server routes vs. a cached admin singleton).

**Token resolution order** (`usePostgrest` / `usePostgrestUser`): explicit `options.token` → token cookie → public anon key from module config → no `Authorization` header. `usePostgrestAdmin` instead always uses the server-only `NUXT_POSTGREST_SECRET_KEY` and bypasses RLS if that role does; its client is memoized as a module-level singleton.

**Database types.** Types come from a generated `Database` type file (fixed path `~~/shared/types/database.types.ts`, not configurable), re-exported through a Nitro template at `#build/types/postgrest-database` (falls back to `any` when the file is missing). The module never generates it: users run the published CLI, `nuxt-postgrest types` (`bin/nuxt-postgrest.mjs`), which shells out to the Supabase CLI with `pnpx`/`npx`, formats with oxfmt, lints via the project's `lint` script, and never overwrites the file on a failed run. Flags: `--schema`, `--path`, `--env-file`, `--lint`; `DATABASE_URL` comes from the environment, `.env` or `.env.local`. See `docs/content/2.guide/4.types.md`.

**Schema handling.** There's no module-level schema option — `usePostgrest`/`usePostgrestUser`/`usePostgrestAdmin` always target `public`. `SchemaKeys<DB>`/`DefaultSchema<DB>` in `createPostgrestClient.ts` derive the available Postgres schemas directly from the generated `Database` type, so calling `createPostgrestClient<Database, 'schema_name'>({ ..., schema: 'schema_name' })` (or `.schema('schema_name')` on any client) for multi-schema/per-tenant use stays fully typed.

## Release process

`pnpm release` bumps the version via `changelogen` (reads conventional commits since the last tag — `fix:`/`feat:`/a `BREAKING CHANGE:` footer decide patch/minor/major), runs the full local check suite and real build, commits, tags, and pushes. The pushed tag triggers `.github/workflows/release.yml`, which re-runs the checks in CI and publishes to npm via trusted publishing (OIDC) — no token stored anywhere, nothing to rotate. New versions then sit in npm's automated security review for a few minutes ("Validating" on npm) before becoming installable; that's expected.

This publishes publicly and pushes real tags/commits to the actual repo — treat it like any other irreversible, external-effect action. Don't run `pnpm release` unless explicitly asked to.

## Testing notes

- `test/unit/` needs no live services.
- `test/e2e/` and the `playground/` both run against real Postgres + PostgREST started by `pnpm db:up` (`docker-compose.yml` for Postgres, `docker-compose.postgrest.yml` for PostgREST — separate files since one Postgres instance can back any number of PostgREST instances/databases; `pnpm db:up`/`db:down` merge both via `-f`). Seeded by `db/seed.sql`. e2e tests build/mount `test/fixtures/basic`, a minimal Nuxt app with a login route, an admin route, and RLS-scoped `me/*` routes exercising each composable.
- `pnpm pretest` runs `nuxt prepare test/fixtures/basic` automatically before `vitest run`.
