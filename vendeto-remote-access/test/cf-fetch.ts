type Matcher = (url: URL, init: RequestInit) => boolean
type Handler = (url: URL, init: RequestInit) => Response | Promise<Response>

export class FetchStub {
  readonly calls: Array<{ url: URL; init: RequestInit }> = []
  private handlers: Array<{ match: Matcher; handler: Handler }> = []

  on(method: string, pattern: RegExp, handler: Handler | Response): void {
    this.handlers.push({
      match: (url, init) => (init.method ?? 'GET') === method && pattern.test(url.toString()),
      handler: typeof handler === 'function' ? handler : () => handler.clone(),
    })
  }

  install(): () => void {
    const original = globalThis.fetch
    globalThis.fetch = async (input, init = {}) => {
      const url = new URL(input instanceof Request ? input.url : input.toString())
      const requestInit = input instanceof Request ? { method: input.method, headers: input.headers, ...init } : init
      this.calls.push({ url, init: requestInit })
      const route = this.handlers.find(item => item.match(url, requestInit))
      if (!route) throw new Error(`Unregistered fetch: ${requestInit.method ?? 'GET'} ${url}`)
      return route.handler(url, requestInit)
    }
    return () => { globalThis.fetch = original }
  }
}

export function json(result: unknown, status = 200): Response {
  return Response.json(result, { status })
}
