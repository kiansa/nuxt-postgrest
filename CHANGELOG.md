# Changelog


## v0.1.0

[compare changes](https://github.com/kiansa/nuxt-postgrest/compare/v0.0.4...v0.1.0)

### ✨ Highlights

- **Auth that works with any library.** After your auth library signs a user in, call the new server auto-imports `mintJwt()` (signs a PostgREST JWT with `NUXT_POSTGREST_JWT_SECRET`) and `setPostgrestToken()` (stores it in the `nuxt_postgrest_token` cookie). `clearPostgrestToken()` removes it on logout. `usePostgrest()` and `usePostgrestUser()` read the cookie, so queries run as the signed-in user in components, during SSR and in server routes, including after client-side navigation. An expired cookie falls back to the anon key instead of failing with `PGRST301`. In the browser the cookie is read on every request, so a client created once (in a store or plugin) never goes stale.
- **`nuxt-postgrest types` CLI.** Generates `shared/types/database.types.ts` from `DATABASE_URL` with the Supabase CLI, formats it with oxfmt and runs your `lint` script. Flags: `--schema`, `--path`, `--env-file`, `--lint`. It never overwrites the file when generation fails.
- **Nuxt 4.0 and newer, ready for Nuxt 5.** From Nuxt 4.6 the server utilities use the portable helpers from `nuxt/server` (the Nuxt 5 path), and older Nuxt gets an equivalent built on h3. The module picks the right one at build time. Verified in clean apps built from the packed module on Nuxt 4.0.0, 4.1.0, 4.2.2, 4.3.1, 4.4.8, 4.5.2 and 4.6.1, and CI runs the suite on the locked Nuxt and on 4.0.0. Nuxt 4.6.0 itself can't render pages (independent of this module). Nuxt 5 is not released yet, so it has not been run against Nuxt 5.
- **New docs.** A redesigned landing page, an Authentication guide, and Playbooks for local Postgres and PostgREST, coming from Supabase, and auth with nuxt-auth-utils, Better Auth, Sidebase Nuxt Auth and Clerk. The Better Auth, Sidebase and Clerk guides were checked against the libraries' types, not run end to end. The README and the playground were redesigned too.
- **Tests.** The `mintJwt`, `setPostgrestToken`, browser fetch, cookie parsing, shared server core and CLI paths are covered.

### ⚠️ Migrating from 0.0.x

1. **The module has no options any more.** The `postgrest: { ... }` config key is gone, so a leftover block is ignored without a warning. Use `runtimeConfig` or the environment:

   | 0.0.x | 0.1.0 | Env var |
   | --- | --- | --- |
   | `postgrest.url` | `runtimeConfig.public.postgrestUrl` | `NUXT_PUBLIC_POSTGREST_URL` |
   | `postgrest.key` | `runtimeConfig.public.postgrestKey` | `NUXT_PUBLIC_POSTGREST_KEY` |
   | `NUXT_POSTGREST_SECRET_KEY` | `runtimeConfig.postgrestSecretKey` | `NUXT_POSTGREST_SECRET_KEY` (unchanged) |
   | (new) | `runtimeConfig.postgrestJwtSecret` | `NUXT_POSTGREST_JWT_SECRET` |
   | `postgrest.tokenKey` | removed | |
   | `postgrest.generateTypes`, `NUXT_POSTGREST_DB_URI` | removed, use the CLI below | |

2. **`nuxt-auth-utils` is no longer detected.** Reading a token from its session no longer happens. After sign-in, mint and store the token yourself:

   ```ts
   const token = await mintJwt({ role: 'authenticated', sub: user.id }, { expiresIn: '1h' })
   setPostgrestToken(event, token)
   ```

   and call `clearPostgrestToken(event)` on logout. Set `NUXT_POSTGREST_JWT_SECRET` to the same value as PostgREST's `jwt-secret`. See the Authentication guide and the nuxt-auth-utils playbook.
3. **`usePostgrestUser(event)` is synchronous.** It no longer returns a promise, so `await` in front of it is harmless but not needed.
4. **Type generation moved to the CLI.** Replace `generateTypes: true` with a script and a connection string:

   ```json
   { "scripts": { "db:types": "nuxt-postgrest types" } }
   ```

   ```bash
   # .env
   DATABASE_URL=postgres://user:password@localhost:5432/postgres
   ```

### 🚀 Enhancements

- Add `nuxt-postgrest types` CLI ([16d49db](https://github.com/kiansa/nuxt-postgrest/commit/16d49db))
- ⚠️  Cookie-based auth with mintJwt, flat runtimeConfig, no module options ([45623e7](https://github.com/kiansa/nuxt-postgrest/commit/45623e7))
- Make the server runtime portable for Nuxt 5 ([9eeeac5](https://github.com/kiansa/nuxt-postgrest/commit/9eeeac5))
- Support Nuxt 4.0 and newer, with a server runtime matched to the installed Nuxt ([0e3f7a0](https://github.com/kiansa/nuxt-postgrest/commit/0e3f7a0))

### 🩹 Fixes

- Ignore a malformed token cookie, and test mintJwt, setPostgrestToken and the browser fetch ([072478a](https://github.com/kiansa/nuxt-postgrest/commit/072478a))

### 📖 Documentation

- Redesign landing page, add Playbooks, update to Nuxt 4.6 ([4a63113](https://github.com/kiansa/nuxt-postgrest/commit/4a63113))
- Redesign the README ([57529d1](https://github.com/kiansa/nuxt-postgrest/commit/57529d1))
- Remove the indie stack playbook and reorder playbooks ([ce3328f](https://github.com/kiansa/nuxt-postgrest/commit/ce3328f))
- Fix the RLS claims example, Nuxt 4 file paths and config details ([1127d82](https://github.com/kiansa/nuxt-postgrest/commit/1127d82))
- Replace em dashes in the local Postgres playbook ([1ea13b1](https://github.com/kiansa/nuxt-postgrest/commit/1ea13b1))

### 🏡 Chore

- Update deps ([94e6554](https://github.com/kiansa/nuxt-postgrest/commit/94e6554))
- Use `client` and a shared `db` util in playground and fixture ([d8ec057](https://github.com/kiansa/nuxt-postgrest/commit/d8ec057))
- Update skills lock ([752143e](https://github.com/kiansa/nuxt-postgrest/commit/752143e))
- Make test:types work on Windows ([97cd9e3](https://github.com/kiansa/nuxt-postgrest/commit/97cd9e3))

### ✅ Tests

- Cover the types CLI end to end with fake package runners ([4af4cb9](https://github.com/kiansa/nuxt-postgrest/commit/4af4cb9))

#### ⚠️ Breaking Changes

- ⚠️  Cookie-based auth with mintJwt, flat runtimeConfig, no module options ([45623e7](https://github.com/kiansa/nuxt-postgrest/commit/45623e7))

### ❤️ Contributors

- Kian Salout ([@kiansa](https://github.com/kiansa))

## v0.0.4

[compare changes](https://github.com/kiansa/nuxt-postgrest/compare/v0.0.3...v0.0.4)

### 🩹 Fixes

- Force Nitro to bundle the generated server token helper ([c7f0d15](https://github.com/kiansa/nuxt-postgrest/commit/c7f0d15))

### ❤️ Contributors

- Kian Salout <info@kiansalout.com>

## v0.0.3

[compare changes](https://github.com/kiansa/nuxt-postgrest/compare/v0.0.2...v0.0.3)

### 🩹 Fixes

- Emit token templates as plain JS so nuxt build works with default buildDir ([e4486f6](https://github.com/kiansa/nuxt-postgrest/commit/e4486f6))

### 🏡 Chore

- Clarify release process and workflow ([5addf5b](https://github.com/kiansa/nuxt-postgrest/commit/5addf5b))

### ❤️ Contributors

- Kian Salout <info@kiansalout.com>
- Kian <kian@example.com>

## v0.0.2

[compare changes](https://github.com/kiansa/nuxt-postgrest/compare/v0.0.1...v0.0.2)

