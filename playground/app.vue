<script setup lang="ts">
const client = usePostgrest()
const { loggedIn, user, fetch: refreshSession, clear } = useUserSession()

const { data: todos, refresh } = await useAsyncData('todos', async () => {
  const { data, error } = await client.from('todos').select('id, title, is_public, owner').order('id')
  if (error) throw error
  return data
})

async function login() {
  await $fetch('/api/login', { method: 'POST' })
  await refreshSession()
  await refresh()
}

async function logout() {
  await clear()
  await refresh()
}
</script>

<template>
  <main style="font-family: system-ui; max-width: 640px; margin: 2rem auto">
    <h1>nuxt-postgrest playground</h1>
    <p v-if="loggedIn">
      Logged in as <b>{{ user?.name }}</b> — you also see your private todos.
      <button @click="logout">
        Log out
      </button>
    </p>
    <p v-else>
      Anonymous — only public todos.
      <button @click="login">
        Log in as alice
      </button>
    </p>
    <ul>
      <li
        v-for="todo in todos"
        :key="todo.id"
      >
        {{ todo.title }} <small>{{ todo.is_public ? 'public' : `private (${todo.owner})` }}</small>
      </li>
    </ul>
  </main>
</template>
