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
src/module.ts              module definition, runtime config, type-gen hook, server auto-imports
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

The module doesn't know about any auth library. After a user signs in with whatever library the app uses, the app calls `mintJwt()` (signs a PostgREST JWT with `NUXT_POSTGREST_JWT_SECRET`, via `jose`) and `setPostgrestToken()` (stores it in the `nuxt_postgrest_token` cookie (a fixed constant, not configurable)). `usePostgrest()` and `usePostgrestUser()` read that cookie; the app side reads `document.cookie` per request in the browser so a long-lived client never goes stale. The cookie is deliberately not `HttpOnly`: browser-side queries after client-side navigation need the token.

Token resolution is `options.token` → token cookie (ignored once its `exp` has passed) → anon key → no header. There is no refresh mechanism and no per-library adapter; don't add one. Library-specific recipes belong in the docs.

## Releasing (maintainers)

```bash
pnpm release
```

Runs lint, tests, type checks and the real build, bumps the version with `changelogen` (based on conventional commits since the last tag — `fix:` → patch, `feat:` → minor, a `BREAKING CHANGE:` footer → major), commits, tags, and pushes.

The pushed tag triggers `.github/workflows/release.yml`, which re-runs the full check suite in a clean CI environment and publishes to npm via trusted publishing (OIDC) — no `NPM_TOKEN`, nothing to rotate, no manual `npm publish`. It also creates the GitHub release and changelog entry.

After publishing, the new version sits in npm's automated security review for a few minutes (shown as "Validating" on the package's npm page) before it's actually installable. That's expected, not a failure — no action needed, just wait it out.
