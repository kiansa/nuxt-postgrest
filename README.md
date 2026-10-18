<p align="center">
  <img src="./assets/readme/hero.svg" width="100%" alt="nuxt-postgrest: typed PostgREST queries for Nuxt that run as the signed-in user. With row-level security, an anonymous visitor sees one todo and Alice sees two.">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/nuxt-postgrest"><img src="https://img.shields.io/npm/v/nuxt-postgrest?color=00dc82&labelColor=0b0d10&label=npm" alt="npm version"></a>
  <a href="https://github.com/kiansa/nuxt-postgrest/actions/workflows/ci.yml"><img src="https://github.com/kiansa/nuxt-postgrest/actions/workflows/ci.yml/badge.svg" alt="CI status"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-00dc82?labelColor=0b0d10" alt="MIT license"></a>
</p>

<p align="center">
  <a href="https://kiansa.github.io/nuxt-postgrest/">Documentation</a> ·
  <a href="https://kiansa.github.io/nuxt-postgrest/guide/authentication">Authentication</a> ·
  <a href="https://kiansa.github.io/nuxt-postgrest/playbooks/local-postgrest">Playbooks</a> ·
  <a href="https://github.com/kiansa/nuxt-postgrest/issues">Report a bug</a>
</p>

**nuxt-postgrest** gives a Nuxt app typed [PostgREST](https://postgrest.org) clients for components, pages and server routes, and runs every query as the signed-in user, so Postgres row-level security does the authorization. It's built on [`@supabase/postgrest-js`](https://github.com/supabase/postgrest-js) and needs no Supabase account or hosting.

## What you get

- **Queries that run as the user.** `usePostgrest()` and `usePostgrestUser(event)` send the signed-in user's JWT, so your RLS policies decide what comes back.
- **Types from your database.** Point it at your generated `Database` type and every table, column and schema is checked as you type.
- **Any auth library.** Sign users in with whatever you use, mint a PostgREST token with `mintJwt()` and store it with `setPostgrestToken()`. There are guides for nuxt-auth-utils, Better Auth, Sidebase Nuxt Auth and Clerk.
- **One client everywhere.** The same API in components, pages and Nitro routes, SSR included, plus `usePostgrestAdmin()` for privileged server work.
- **Thin by design.** It is the `postgrest-js` query builder you already know, with `.schema()` and `createPostgrestClient()` for other schemas and per-tenant clients.

## How a request travels

<p align="center">
  <img src="./assets/readme/flow.svg" width="100%" alt="A request goes from your app through usePostgrest(), which attaches the user's JWT, to PostgREST, which verifies it and switches role, to Postgres, where row-level security decides the rows. The token is the token option, then the cookie, then the anon key, then no header.">
</p>

Your auth library signs the user in. You mint a PostgREST JWT for them and store it in a cookie, and from then on every query, including ones made after client-side navigation, carries it. PostgREST turns the JWT's `role` claim into a Postgres role, and your policies see its other claims.

## Quick start

**1. Install**

```bash
npx nuxi module add nuxt-postgrest
```

**2. Point it at PostgREST**

```bash
# .env
NUXT_PUBLIC_POSTGREST_URL=http://localhost:3001
# Must equal PostgREST's jwt-secret. Needed to mint user tokens.
NUXT_POSTGREST_JWT_SECRET=replace-with-a-secret-of-at-least-32-characters
```

**3. Query**

```vue
<script setup lang="ts">
const client = usePostgrest()

const { data } = await useAsyncData('todos', async () => {
  const { data, error } = await client.from('todos').select('*')
  if (error) throw error
  return data
})
</script>
```

**4. Run queries as the signed-in user**

After your auth library signs the user in, mint a token for them and store it:

```ts
// server/api/login.post.ts
export default defineEventHandler(async (event) => {
  // ...your auth library signs the user in
  const token = await mintJwt({ role: 'authenticated', sub: user.id })
  setPostgrestToken(event, token)

  return { ok: true }
})
```

Now `usePostgrest()` and `usePostgrestUser(event)` send that token. Step-by-step setups for [nuxt-auth-utils](https://kiansa.github.io/nuxt-postgrest/playbooks/auth-nuxt-auth-utils), [Better Auth](https://kiansa.github.io/nuxt-postgrest/playbooks/auth-better-auth), [Sidebase Nuxt Auth](https://kiansa.github.io/nuxt-postgrest/playbooks/auth-sidebase) and [Clerk](https://kiansa.github.io/nuxt-postgrest/playbooks/auth-clerk) are in the docs.

## Typed from your database

<p align="center">
  <img src="./assets/readme/types.svg" width="100%" alt="A query selects the column titel from todos. The editor underlines it and reports that the column does not exist on todos. With the typo fixed, data is typed as an array of objects with id, title and done, or null.">
</p>

The module reads a `Database` type from `shared/types/database.types.ts`. Generate it with the bundled CLI, which wraps the Supabase CLI and needs only a connection string:

```bash
# .env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable
```

```json
{
  "scripts": {
    "db:types": "nuxt-postgrest types"
  }
}
```

```bash
pnpm run db:types
```

Multiple schemas, a custom path and linting are covered in the [types guide](https://kiansa.github.io/nuxt-postgrest/guide/types).

## Documentation

- **Start:** [Introduction](https://kiansa.github.io/nuxt-postgrest/getting-started/introduction) · [Installation](https://kiansa.github.io/nuxt-postgrest/getting-started/installation)
- **Guide:** [Configuration](https://kiansa.github.io/nuxt-postgrest/guide/configuration) · [Composables](https://kiansa.github.io/nuxt-postgrest/guide/composables) · [Authentication](https://kiansa.github.io/nuxt-postgrest/guide/authentication) · [Types](https://kiansa.github.io/nuxt-postgrest/guide/types)
- **Playbooks:** [Local Postgres and PostgREST](https://kiansa.github.io/nuxt-postgrest/playbooks/local-postgrest) · [Coming from Supabase](https://kiansa.github.io/nuxt-postgrest/playbooks/coming-from-supabase)

## Development

```bash
git clone https://github.com/kiansa/nuxt-postgrest
cd nuxt-postgrest
pnpm install
pnpm db:up      # Postgres + PostgREST on :5432 / :3001
pnpm dev        # playground at http://localhost:3000
pnpm test       # unit + e2e against the local PostgREST
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full workflow.

## License

[MIT](./LICENSE)
