# nuxt-postgrest

First-class [PostgREST](https://postgrest.org) for [Nuxt](https://nuxt.com): typed clients, SSR-aware composables, and auth-aware JWT forwarding. Built on [`@supabase/postgrest-js`](https://github.com/supabase/postgrest-js) — no Supabase account or hosting required.

[📖 Documentation](https://kiansa.github.io/nuxt-postgrest/) · [🐛 Report a bug](https://github.com/kiansa/nuxt-postgrest/issues)

## Features

- 🔒 Forwards the logged-in user's JWT so Postgres row-level security applies
- 🧠 Fully typed from your generated `Database` type — tables, columns and schemas checked at compile time
- 🌐 One client for components, pages and Nitro server routes, SSR included
- 🔑 Works with any auth library: `mintJwt()` a PostgREST JWT after sign-in, `setPostgrestToken()` stores it
- 🗂️ Switch Postgres schemas or build per-tenant clients on demand
- 🪶 A thin layer over the battle-tested `postgrest-js` query builder — nothing new to learn

## Quick start

```bash
npx nuxi module add nuxt-postgrest
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-postgrest'],
  runtimeConfig: {
    public: { postgrestUrl: 'http://localhost:3001' },
  },
})
```

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

See the [full documentation](https://kiansa.github.io/nuxt-postgrest/) for configuration, authentication, type generation and the server-side `usePostgrestUser` / `usePostgrestAdmin` composables.

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
