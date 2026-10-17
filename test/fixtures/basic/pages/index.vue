<script setup lang="ts">
// SSR: token comes from the nuxt-auth-utils session (client-visible field)
const client = usePostgrest()
const { data } = await useAsyncData('todos', async () => {
  const { data, error } = await client.from('todos').select('title').order('id')
  if (error) throw error
  return data
})
</script>

<template>
  <ul id="todos">
    <li
      v-for="todo in data"
      :key="todo.title"
    >
      {{ todo.title }}
    </li>
  </ul>
</template>
