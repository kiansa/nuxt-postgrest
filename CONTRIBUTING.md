# Contributing

## Setup

```bash
git clone https://github.com/kiansa/nuxt-postgrest
cd nuxt-postgrest
pnpm install
pnpm db:up          # Postgres + PostgREST via docker-compose
pnpm dev             # playground with your changes, live-reloading
```

`pnpm db:down` stops and wipes the local database.

## Checks before opening a PR

```bash
pnpm lint
pnpm test        # unit + e2e — needs `pnpm db:up` running
pnpm test:types  # compile-time checks in playground/ and test/fixtures/basic/
```

The module requires Nuxt 4+; CI tests against the pinned version plus a nightly job against `nuxt@latest`.

## Project layout

```
src/module.ts              module definition, runtime config, type-gen hook, nuxt-auth-utils detection
src/runtime/shared/         createPostgrestClient — the one place a PostgrestClient is built
src/runtime/app/            usePostgrest (client & SSR)
src/runtime/server/         usePostgrestUser, usePostgrestAdmin (Nitro only)
playground/                 manual testing app — a full login flow, RLS, admin & schema examples
test/unit/                  pure-logic tests (no PostgREST needed)
test/e2e/                   @nuxt/test-utils tests against test/fixtures/basic, real PostgREST
docs/                       Docus documentation site
db/seed.sql, docker-compose.yml, docker-compose.postgrest.yml   local Postgres + PostgREST used by dev, tests and CI
```

## Auth

`nuxt-auth-utils` is the only auth library the module knows about, and it's the only one worth special-casing: it's detected once in `setup()` via `hasNuxtModule`, and that boolean decides the *contents* of two small code-generated files (`postgrest-token-app.ts` / `postgrest-token-server.ts`, written via `addTemplate`) — real code reading the session when it's installed, a one-line stub returning `undefined` when it's not. This is deliberate: a static top-level `import { useUserSession } from '#imports'` in a published module's runtime would break the build for any app that doesn't have `nuxt-auth-utils` installed, since that auto-import wouldn't exist for them.

There's no pluggable-provider mechanism beyond this. Every other auth library is out of scope for the module — users read their own session however their library exposes it, and pass the resulting token to `usePostgrest({ token })` / `usePostgrestUser(event, { token })` themselves. If you're touching this, keep it to those two template files in `src/module.ts`; don't reintroduce a per-provider adapter directory.

## Releasing (maintainers)

```bash
pnpm release
```

Runs lint, tests, type checks and the real build, bumps the version with `changelogen` (based on conventional commits since the last tag — `fix:` → patch, `feat:` → minor, a `BREAKING CHANGE:` footer → major), commits, tags, and pushes.

The pushed tag triggers `.github/workflows/release.yml`, which re-runs the full check suite in a clean CI environment and publishes to npm via trusted publishing (OIDC) — no `NPM_TOKEN`, nothing to rotate, no manual `npm publish`. It also creates the GitHub release and changelog entry.

After publishing, the new version sits in npm's automated security review for a few minutes (shown as "Validating" on the package's npm page) before it's actually installable. That's expected, not a failure — no action needed, just wait it out.
