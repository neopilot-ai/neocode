import { describe, expect, test } from "bun:test"
import {
  hasNeoIndexingAuth,
  resolveNeoIndexingAuth,
  shouldDefaultIndexingToNeo,
} from "../../src/neocode/indexing-auth"

describe("Neo indexing auth resolution", () => {
  test("detects auth from explicit indexing Neo config", () => {
    const auth = resolveNeoIndexingAuth({
      config: { indexing: { neo: { apiKey: "idx-token", baseUrl: "https://idx.test", organizationId: "org_idx" } } },
    })

    expect(auth).toEqual({ apiKey: "idx-token", baseUrl: "https://idx.test", organizationId: "org_idx" })
    expect(hasNeoIndexingAuth({ config: { indexing: { neo: { apiKey: "idx-token" } } } })).toBe(true)
  })

  test("detects auth from provider config, provider state, auth storage, and env", () => {
    expect(
      resolveNeoIndexingAuth({ config: { provider: { neo: { options: { apiKey: "cfg-token" } } } } }).apiKey,
    ).toBe("cfg-token")
    expect(resolveNeoIndexingAuth({ provider: { options: { neocodeToken: "provider-token" } } }).apiKey).toBe(
      "provider-token",
    )
    expect(resolveNeoIndexingAuth({ auth: { type: "oauth", access: "oauth-token", accountId: "org_oauth" } })).toEqual(
      {
        apiKey: "oauth-token",
        organizationId: "org_oauth",
      },
    )
    expect(resolveNeoIndexingAuth({ env: { NEO_API_KEY: "env-token", NEO_ORG_ID: "org_env" } })).toEqual({
      apiKey: "env-token",
      organizationId: "org_env",
    })
  })

  test("defaults to Neo only when no provider or other embedder config is present", () => {
    const auth = { apiKey: "neo-token" }

    expect(shouldDefaultIndexingToNeo({}, auth)).toBe(true)
    expect(shouldDefaultIndexingToNeo({ provider: "openai" }, auth)).toBe(false)
    expect(shouldDefaultIndexingToNeo({ openai: { apiKey: "openai-key" } }, auth)).toBe(false)
    expect(shouldDefaultIndexingToNeo({ ollama: { baseUrl: "http://localhost:11434" } }, auth)).toBe(false)
  })
})
