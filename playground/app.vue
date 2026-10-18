<script setup lang="ts">
const { loggedIn, user, fetch: refreshSession } = useUserSession()

// Decode the token cookie just to show what PostgREST receives (no verification: display only)
function readClaims(token?: string | null) {
  try {
    return token ? JSON.parse(atob(token.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/'))) as { role: string, sub?: string, exp?: number } : null
  }
  catch {
    return null
  }
}

const claims = ref(readClaims(useCookie<string | null>('nuxt_postgrest_token').value))
const minutesLeft = computed(() => claims.value?.exp ? Math.max(0, Math.round((claims.value.exp * 1000 - Date.now()) / 60000)) : null)

const { data: todos, refresh } = await useAsyncData('todos', async () => {
  const { data, error } = await usePostgrest().from('todos').select('id, title, is_public, owner').order('id')
  if (error) throw error
  return data
})

async function login() {
  await $fetch('/api/login', { method: 'POST' })
  await refreshSession()
  claims.value = readClaims(useCookie<string | null>('nuxt_postgrest_token').value)
  await refresh()
}

async function logout() {
  await $fetch('/api/logout', { method: 'POST' })
  await refreshSession()
  claims.value = null
  await refresh()
}
</script>

<template>
  <main>
    <header>
      <h1><i /> nuxt-postgrest <small>playground</small></h1>
    </header>

    <section class="card who">
      <div>
        <p class="label">
          Acting as
        </p>
        <p class="identity">
          {{ loggedIn ? user?.name : 'anonymous' }}
        </p>
        <p class="meta">
          <template v-if="claims">
            role <code>{{ claims.role }}</code>
            <template v-if="claims.sub">
              · sub <code>{{ claims.sub }}</code>
            </template>
            <template v-if="minutesLeft !== null">
              · expires in {{ minutesLeft }} min
            </template>
          </template>
          <template v-else>
            No token cookie, so PostgREST runs queries as <code>anon</code>
          </template>
        </p>
      </div>
      <button
        :class="loggedIn ? 'ghost' : 'primary'"
        @click="loggedIn ? logout() : login()"
      >
        {{ loggedIn ? 'Log out' : 'Log in as alice' }}
      </button>
    </section>

    <section class="card">
      <h2>Todos <span>{{ todos?.length }}</span></h2>
      <ul>
        <li
          v-for="todo in todos"
          :key="todo.id"
        >
          {{ todo.title }}
          <b :class="todo.is_public ? 'public' : 'private'">{{ todo.is_public ? 'public' : todo.owner }}</b>
        </li>
      </ul>
      <p class="hint">
        Row-level security decides which rows come back.
      </p>
    </section>
  </main>
</template>

<style>
:root {
  color-scheme: dark;
  --green: #00dc82;
  --border: #ffffff14;
}

body {
  min-height: 100vh;
  margin: 0;
  background: radial-gradient(60rem 30rem at 50% -10%, #00dc8214, transparent) no-repeat, #0b0d10;
  color: #e6e8eb;
  font: 15px/1.5 ui-sans-serif, system-ui, sans-serif;
}

main {
  max-width: 34rem;
  margin: 0 auto;
  padding: 3rem 1.25rem;
}

h1 {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0 0 1.5rem;
  font-size: 1.1rem;
}

h1 i {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 12px var(--green);
}

h1 small {
  color: #8b929c;
  font-weight: 400;
}

.card {
  margin-bottom: 1rem;
  padding: 1.1rem 1.25rem;
  border: 1px solid var(--border);
  border-radius: 0.9rem;
  background: #ffffff08;
}

.who {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.who p {
  margin: 0;
}

.label {
  color: #8b929c;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.identity {
  font-size: 1.4rem;
  font-weight: 600;
}

.meta,
.hint {
  color: #8b929c;
  font-size: 0.8rem;
}

code {
  padding: 0.05rem 0.35rem;
  border-radius: 0.3rem;
  background: #ffffff10;
  color: #e6e8eb;
}

button {
  flex: none;
  padding: 0.55rem 1rem;
  border: 1px solid var(--border);
  border-radius: 0.6rem;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

button.primary {
  border-color: transparent;
  background: var(--green);
  color: #04130c;
  font-weight: 600;
}

button:hover {
  filter: brightness(1.15);
}

h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
}

h2 span {
  padding: 0 0.45rem;
  border-radius: 1rem;
  background: #ffffff10;
  color: #8b929c;
  font-size: 0.75rem;
  font-weight: 400;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.6rem 0;
  border-top: 1px solid var(--border);
}

li b {
  padding: 0.05rem 0.55rem;
  border-radius: 1rem;
  font-size: 0.72rem;
  font-weight: 500;
}

.public {
  background: #ffffff10;
  color: #8b929c;
}

.private {
  background: #00dc8220;
  color: var(--green);
}

.hint {
  margin: 0.75rem 0 0;
}
</style>
