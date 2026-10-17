const url = process.env.NUXT_SITE_URL || 'https://kiansa.github.io/nuxt-postgrest/'

const base = new URL(url).pathname

export default defineNuxtConfig({
  extends: ['docus'],
  devtools: { enabled: false },
  // Derived from `url` so this is `/` once a root custom domain replaces the
  // default GitHub Pages project URL, with no path segment to strip.
  app: {
    baseURL: base,
  },
  // Origin only: site-config and agent-discovery reject a path in `url`; the base path lives in `app.baseURL`.
  site: {
    name: 'Nuxt PostgREST',
    url: new URL(url).origin,
  },
  // The base path isn't prefixed onto these automatically, so build the URLs here.
  appConfig: {
    header: {
      logo: {
        light: `${base}logo.svg`,
        dark: `${base}logo.svg`,
        favicon: `${base}favicon.svg`,
        alt: 'Nuxt',
      },
    },
  },
  // `ai-chat` is opt-in via credentials; stop warning when they're absent
  docus: {
    assistant: { enabled: false },
  },
  llms: {
    domain: url,
    title: 'Nuxt PostgREST',
    description: 'First-class PostgREST for Nuxt: typed clients, SSR-aware composables and auth-aware JWT forwarding.',
  },
  // GitHub Pages project sites can't serve /robots.txt from the origin root, so @nuxt/robots can't generate one.
  robots: {
    robotsTxt: false,
  },
})
