<script setup lang="ts">
const appConfig = useAppConfig()
const logo = computed(() => appConfig.header?.logo?.light || '')
</script>

<template>
  <span class="flex items-center gap-2">
    <img
      v-if="logo"
      :src="logo"
      :alt="appConfig.header?.logo?.alt || ''"
      class="h-6 w-auto shrink-0"
    >
    <span>{{ appConfig.header?.title }}</span>
  </span>
</template>
