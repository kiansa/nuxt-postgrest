---
seo:
  title: Nuxt PostgREST
  description: First-class PostgREST for Nuxt. Typed clients, SSR-aware composables and auth-aware JWT forwarding. No Supabase required.
---

::u-page-hero
#top
  :hero-shader

#headline
  :::u-button
  ---
  to: https://www.npmjs.com/package/nuxt-postgrest
  color: neutral
  variant: subtle
  size: sm
  icon: i-simple-icons-npm
  trailing-icon: i-lucide-arrow-right
  class: rounded-full
  ---
  Nuxt 4 module · open source
  :::

#title
[PostgREST]{.text-primary}, the Nuxt way

#description
Typed clients, SSR-aware composables and automatic JWT forwarding for any self-hosted PostgREST.<br>Row-level security does the authorization. No Supabase required.

#links
  :::u-button
  ---
  size: xl
  to: /getting-started/installation
  trailing-icon: i-lucide-arrow-right
  ---
  Get started
  :::

  :::u-button
  ---
  color: neutral
  icon: i-simple-icons-github
  size: xl
  to: https://github.com/kiansa/nuxt-postgrest
  variant: outline
  ---
  Star on GitHub
  :::

#body
  :install-command
::

::u-page-section
---
headline: Zero glue code
ui:
  container: py-10 sm:py-14 lg:py-16
orientation: horizontal
---
#title
Write the query. [The JWT follows.]{.text-primary}

#description
The logged-in user's token is attached for you: in components, during SSR and in Nitro routes. Postgres sees the real user, so your RLS policies just work.

#default
  ::::code-group
  ```vue [Component]
  <script setup lang="ts">
  const client = usePostgrest()

  const { data: todos } = await useAsyncData('todos', async () => {
    const { data, error } = await client.from('todos').select('*')
    if (error) throw error
    return data
  })
  </script>
  ```

  ```ts [Server route]
  // server/api/my-todos.get.ts
  export default defineEventHandler(async (event) => {
    const client = usePostgrestUser(event)
    const { data, error } = await client.from('todos').select('*')
    if (error) throw createError({ statusCode: 500, message: error.message })
    return data
  })
  ```

  ```ts [Admin]
  // server/api/admin/todos.get.ts
  export default defineEventHandler(async () => {
    const db = usePostgrestAdmin()
    const { data } = await db.from('todos').select('*')
    return data
  })
  ```
  ::::
::

::u-page-section
---
headline: How it works
ui:
  container: py-10 sm:py-14 lg:py-16
---
#title
One request, four hops

#description
Nothing is proxied and nothing is stored. The module resolves a token, PostgREST verifies it and Postgres enforces your policies.

#default
  :request-flow
::

::u-page-section
---
headline: Types
ui:
  container: py-10 sm:py-14 lg:py-16
orientation: horizontal
reverse: true
---
#title
Typos fail at [compile time.]{.text-primary}

#description
Point the module at your generated `Database` type and every table, column, filter and embedded relation is checked as you type. Regenerate it with one script whenever your schema changes.

#links
  :::u-button
  ---
  to: /guide/types
  color: neutral
  variant: subtle
  trailing-icon: i-lucide-arrow-right
  ---
  Set up types
  :::

#default
  :type-demo
::

::u-page-section
---
headline: Built for production Nuxt apps
ui:
  container: py-10 sm:py-14 lg:py-16
---
#title
Everything a PostgREST app needs

#features
  :::u-page-card
  ---
  icon: i-lucide-shield-check
  spotlight: true
  ---
  #title
  Row-level security, as the user

  #description
  `usePostgrest()` and `usePostgrestUser()` forward the logged-in user's JWT, so Postgres RLS does the authorization.
  :::

  :::u-page-card
  ---
  icon: i-lucide-server
  spotlight: true
  ---
  #title
  SSR and Nitro ready

  #description
  One client for components, pages and server routes, with a server-only admin client for privileged work.
  :::

  :::u-page-card
  ---
  icon: i-lucide-key-round
  spotlight: true
  ---
  #title
  Auth integration

  #description
  Use any auth library. Mint a JWT with `mintJwt()`, store it with `setPostgrestToken()`, and every query runs as that user.
  :::

  :::u-page-card
  ---
  icon: i-lucide-layers
  spotlight: true
  ---
  #title
  Schemas and tenants

  #description
  Switch Postgres schemas with `.schema()` or build per-tenant clients with `createPostgrestClient()`.
  :::

  :::u-page-card
  ---
  icon: i-lucide-arrow-left-right
  spotlight: true
  ---
  #title
  Coming from Supabase?

  #description
  Same query builder, same `from().select()`. Keep your queries, drop the hosting. There is a [migration guide](/playbooks/coming-from-supabase).
  :::

  :::u-page-card
  ---
  icon: i-lucide-feather
  spotlight: true
  ---
  #title
  Thin by design

  #description
  Built on the battle-tested `@supabase/postgrest-js` query builder. Nothing to learn beyond PostgREST itself.
  :::
::

::u-page-section
---
ui:
  container: py-10 sm:py-14 lg:py-16
---
  :::u-page-c-t-a
  ---
  title: Ship your next Nuxt app on plain Postgres
  description: Install the module, point it at PostgREST and start querying in under a minute.
  variant: subtle
  links:
    - label: Get started
      to: /getting-started/installation
      trailingIcon: i-lucide-arrow-right
    - label: Run PostgREST locally
      to: /playbooks/local-postgrest
      color: neutral
      variant: outline
  ---
  :::
::
