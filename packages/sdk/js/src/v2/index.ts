export * from "./client.js"
export * from "./server.js"

import { createNeoClient } from "./client.js"
import { createNeoServer } from "./server.js"
import type { ServerOptions } from "./server.js"

export * as data from "./data.js"

export async function createNeo(options?: ServerOptions) {
  const server = await createNeoServer({
    ...options,
  })

  const client = createNeoClient({
    baseUrl: server.url,
  })

  return {
    client,
    server,
  }
}
