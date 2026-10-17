<script setup lang="ts">
import { createRenderer } from '~/assets/hero-shader/renderer'
import type { Renderer } from '~/assets/hero-shader/renderer'

const canvas = ref<HTMLCanvasElement>()
const slot = ref<HTMLElement>()
const failed = ref(false)
const colorMode = useColorMode()

let renderer: Renderer | undefined

onMounted(() => {
  if (!canvas.value || !slot.value || !window.WebGL2RenderingContext) {
    failed.value = true
    return
  }

  renderer = createRenderer(canvas.value, slot.value, null, colorMode.value === 'light')
  renderer.onFirstFrame = () => {
    if (canvas.value) canvas.value.style.opacity = '0.15'
  }
  // No WebGL2, or a software renderer: drop the canvas and keep the plain hero
  renderer.ready.catch(() => {
    failed.value = true
  })

  document.addEventListener('visibilitychange', onVisibility)
})

function onVisibility() {
  renderer?.setPaused(document.hidden)
}

watch(() => colorMode.value, (mode) => {
  renderer?.setLight(mode === 'light')
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibility)
  renderer?.dispose()
})
</script>

<template>
  <div
    v-if="!failed"
    class="hero-shader pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    aria-hidden="true"
  >
    <canvas
      ref="canvas"
      class="size-full opacity-0 transition-opacity duration-1000"
    />
    <!-- the range is drawn around this point, like the logo on the Nuxt loading screen -->
    <div
      ref="slot"
      class="absolute left-1/2 top-[85%] size-24 -translate-x-1/2 -translate-y-1/2"
    />
  </div>
</template>

<style scoped>
/* Fade the canvas into the page so there is no hard edge at the hero's bottom or sides */
.hero-shader {
  -webkit-mask-image: linear-gradient(to bottom, #000 55%, transparent 100%);
  mask-image: linear-gradient(to bottom, #000 55%, transparent 100%);
}
</style>
