<script setup lang="ts">
// SSR: the token comes from the token cookie
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
