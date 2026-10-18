export interface AuthorizedFetchOptions {
  /** The token to send. Called on every request, so a client created once keeps up with login, logout and expiry. */
  getToken: () => string | undefined
  /** Leave the request's own `Authorization` header alone (the caller set it deliberately). */
  keepAuthorization?: boolean
  /** The fetch to wrap. Defaults to the global one, looked up on each call. */
  fetch?: typeof fetch
}

/** A `fetch` that sets `Authorization` from the current token on every request. */
export function createAuthorizedFetch({ getToken, keepAuthorization, fetch: base }: AuthorizedFetchOptions): typeof fetch {
  return (input, init) => {
    const send = base ?? globalThis.fetch

    if (keepAuthorization) {
      return send(input, init)
    }

    const token = getToken()
    const headers = new Headers(init?.headers)

    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    else {
      headers.delete('Authorization')
    }

    return send(input, { ...init, headers })
  }
}
