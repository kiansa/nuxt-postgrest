<script setup lang="ts">
const nodes = [
  { icon: 'i-lucide-monitor-smartphone', title: 'Your app', text: 'Component, page or Nitro route' },
  { icon: 'i-lucide-plug-zap', title: 'usePostgrest()', text: 'Picks the right JWT for you' },
  { icon: 'i-lucide-server', title: 'PostgREST', text: 'Verifies it, switches role' },
  { icon: 'i-simple-icons-postgresql', title: 'Postgres', text: 'Row-level security decides' },
]

const order = [
  { label: 'options.token', hint: 'explicit' },
  { label: 'cookie', hint: 'token cookie' },
  { label: 'anon key', hint: 'public config' },
  { label: 'no header', hint: 'db-anon-role' },
]
</script>

<template>
  <div class="my-2">
    <ol class="grid items-start gap-y-2 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] md:gap-y-0">
      <template
        v-for="(node, i) in nodes"
        :key="node.title"
      >
        <li class="flex flex-col items-center text-center">
          <div
            class="flow-node relative flex size-16 items-center justify-center rounded-2xl border border-default bg-elevated shadow-sm"
            :style="{ '--i': i }"
          >
            <UIcon
              :name="node.icon"
              class="size-7 text-primary"
            />
          </div>
          <p class="mt-3 font-mono text-sm font-semibold text-highlighted">
            {{ node.title }}
          </p>
          <p class="mt-1 max-w-40 text-xs text-muted">
            {{ node.text }}
          </p>
        </li>
        <li
          v-if="i < nodes.length - 1"
          aria-hidden="true"
          class="flow-link relative mx-auto h-10 w-px md:mt-8 md:h-px md:w-full md:min-w-10 md:max-w-24"
        >
          <span
            class="flow-dot"
            :style="{ '--i': i }"
          >
            <span
              v-if="i === 0"
              class="flow-chip"
            >JWT</span>
          </span>
        </li>
      </template>
    </ol>

    <div class="mt-12 rounded-xl border border-default bg-default/60 p-4 backdrop-blur">
      <p class="mb-3 text-center text-xs font-medium uppercase tracking-wider text-muted">
        Which token? First match wins
      </p>
      <ul class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-center">
        <template
          v-for="(step, i) in order"
          :key="step.label"
        >
          <li class="flex flex-1 flex-col items-center rounded-lg bg-elevated px-3 py-2 text-center sm:max-w-44">
            <code class="text-sm font-semibold text-highlighted">{{ step.label }}</code>
            <span class="text-xs text-muted">{{ step.hint }}</span>
          </li>
          <UIcon
            v-if="i < order.length - 1"
            name="i-lucide-chevron-right"
            class="hidden size-4 shrink-0 text-muted sm:block"
          />
        </template>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.flow-link {
  background: linear-gradient(var(--dir, to right), transparent, var(--ui-border-accented, #8884) 20%, var(--ui-border-accented, #8884) 80%, transparent);
}
@media (max-width: 767px) {
  .flow-link { --dir: to bottom; }
}

.flow-dot {
  position: absolute;
  top: 50%;
  left: 0;
  display: grid;
  place-items: center;
  width: 8px;
  height: 8px;
  margin: -4px 0 0 -4px;
  border-radius: 9999px;
  background: var(--ui-primary);
  box-shadow: 0 0 12px 2px var(--ui-primary);
  opacity: 0;
  animation: travel-x 2.8s cubic-bezier(.45, 0, .2, 1) infinite;
  animation-delay: calc(var(--i) * 0.9s);
}
@media (max-width: 767px) {
  .flow-dot { top: 0; left: 50%; animation-name: travel-y; }
}

.flow-chip {
  position: absolute;
  bottom: 14px;
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--ui-primary);
  color: var(--ui-bg);
  font: 600 10px/1.4 ui-monospace, monospace;
}

.flow-node {
  animation: pulse 2.8s ease-in-out infinite;
  animation-delay: calc(var(--i) * 0.9s + 1.1s);
}

@keyframes travel-x {
  0% { left: 0; opacity: 0; }
  12% { opacity: 1; }
  80% { opacity: 1; }
  100% { left: 100%; opacity: 0; }
}
@keyframes travel-y {
  0% { top: 0; opacity: 0; }
  12% { opacity: 1; }
  80% { opacity: 1; }
  100% { top: 100%; opacity: 0; }
}
@keyframes pulse {
  0%, 100% { border-color: var(--ui-border); }
  8% { border-color: var(--ui-primary); }
  30% { border-color: var(--ui-border); }
}

@media (prefers-reduced-motion: reduce) {
  .flow-dot, .flow-node { animation: none; }
  .flow-dot { opacity: 1; left: 50%; }
}
</style>
