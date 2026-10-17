// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
export default createConfigForNuxt({
  features: {
    // Rules for module authors
    tooling: true,
    // Rules for formatting
    stylistic: true,
  },
  dirs: {
    src: [
      './playground',
      './test/fixtures/basic',
    ],
  },
})
  .append({
    // Nuxt pages/layouts are routed by file name, not registered as components
    files: ['**/pages/**/*.vue', '**/app.vue'],
    rules: { 'vue/multi-word-component-names': 'off' },
  }, {
    // Vendored from nuxt/nuxt's loading screen; keep its style so it stays diffable against upstream
    files: ['docs/app/assets/hero-shader/**'],
    rules: { '@stylistic/max-statements-per-line': 'off' },
  }, {
    ignores: ['docs/.data', 'docs/.output', 'docs/.nuxt'],
  })
