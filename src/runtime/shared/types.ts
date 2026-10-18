import type { H3Event } from 'h3'
import type { RequestEvent } from 'nuxt/server'

/**
 * The event a server route receives. Nitro v2 (h3 v1) passes an `H3Event` and Nitro v3 (h3 v2, Nuxt 5) a
 * web-standard `RequestEvent`, so the server utilities accept either.
 */
export type ServerEvent = RequestEvent | H3Event
