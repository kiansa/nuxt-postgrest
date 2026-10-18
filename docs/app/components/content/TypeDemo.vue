<!-- eslint-disable vue/max-attributes-per-line -->
<template>
  <div class="overflow-hidden rounded-xl border border-default bg-elevated/60 shadow-lg backdrop-blur">
    <div class="flex items-center gap-2 border-b border-default px-4 py-2.5">
      <span class="size-2.5 rounded-full bg-red-400/80" />
      <span class="size-2.5 rounded-full bg-amber-400/80" />
      <span class="size-2.5 rounded-full bg-emerald-400/80" />
      <span class="ml-3 font-mono text-xs text-muted">app/pages/todos.vue</span>
    </div>

    <pre class="overflow-x-auto p-4 font-mono text-[13px] leading-7 text-default"><code><span class="text-sky-600 dark:text-sky-300">const</span> { data } = <span class="text-sky-600 dark:text-sky-300">await</span> <span class="text-amber-600 dark:text-amber-300">usePostgrest</span>()
  .<span class="text-amber-600 dark:text-amber-300">from</span>(<span class="text-emerald-600 dark:text-emerald-300">'todos'</span>)
  .<span class="text-amber-600 dark:text-amber-300">select</span>(<span class="text-emerald-600 dark:text-emerald-300">'id, </span><span class="type-squiggle text-emerald-600 dark:text-emerald-300">titel</span><span class="text-emerald-600 dark:text-emerald-300">, done'</span>)</code></pre>

    <div class="mx-4 mb-4 flex gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs">
      <UIcon name="i-lucide-circle-x" class="mt-0.5 size-4 shrink-0 text-red-500" />
      <p class="font-mono leading-5 text-default">
        <span class="font-semibold">column 'titel' does not exist on 'todos'.</span><br>
        <span class="text-muted">Caught while you type. Fix the typo and the result is fully typed:</span>
      </p>
    </div>

    <div class="border-t border-default bg-default/50 px-4 py-3 font-mono text-xs text-muted">
      <span class="text-primary">data</span>:
      <span class="text-default">{ id: number; title: string; done: boolean }[] | null</span>
    </div>
  </div>
</template>

<style scoped>
pre {
  margin: 0;
  background: transparent;
}
.type-squiggle {
  text-decoration: underline wavy #ef4444;
  text-underline-offset: 4px;
  text-decoration-thickness: 1.5px;
}
</style>
