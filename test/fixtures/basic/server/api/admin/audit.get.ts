import type { Database } from '../../../shared/types/database.types'

export default defineEventHandler(async () => {
  // Both ways of targeting a non-default schema
  const viaSchemaMethod = await usePostgrestAdmin().schema('internal').from('audit_log').select('message')

  const { postgrestUrl: url } = useRuntimeConfig().public
  const internal = createPostgrestClient<Database, 'internal'>({
    url,
    key: useRuntimeConfig().postgrestSecretKey,
    schema: 'internal',
  })
  const viaFactory = await internal.from('audit_log').select('message')

  // Compile-time guarantees (checked by `pnpm test:types`)
  // @ts-expect-error unknown table
  void (() => usePostgrestAdmin().from('does_not_exist'))
  // @ts-expect-error `todos` is not in the internal schema
  void (() => internal.from('todos'))

  return {
    viaSchemaMethod: viaSchemaMethod.data?.map(r => r.message),
    viaFactory: viaFactory.data?.map(r => r.message),
  }
})
