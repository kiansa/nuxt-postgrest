<script setup lang="ts">
const props = withDefaults(defineProps<{ command?: string }>(), {
  command: 'npx nuxi module add nuxt-postgrest',
})

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

async function copy() {
  try {
    await navigator.clipboard.writeText(props.command)
    copied.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (copied.value = false), 1800)
  }
  catch {
    // clipboard blocked: the command is still selectable
  }
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div class="mx-auto mt-2 flex w-full max-w-md items-center gap-3 rounded-lg border border-default bg-default/70 py-1.5 pl-4 pr-1.5 font-mono text-sm shadow-sm backdrop-blur">
    <span class="select-none text-primary">$</span>
    <code class="flex-1 select-all overflow-x-auto whitespace-nowrap text-left text-default">{{ command }}</code>
    <UButton
      :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
      color="neutral"
      variant="ghost"
      size="sm"
      :aria-label="copied ? 'Copied' : 'Copy command'"
      @click="copy"
    />
  </div>
</template>
