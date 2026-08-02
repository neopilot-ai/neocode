import { describe, expect, it } from "bun:test"

import {
  disabledProviderOptions,
  providersWithNeoFallback,
  visibleConnectedIds,
} from "../../webview-ui/src/components/settings/provider-visibility"

describe("visibleConnectedIds", () => {
  it("hides Neo from the connected list when auth is missing", () => {
    const ids = visibleConnectedIds(["neo", "openrouter"], { openrouter: "api" })

    expect(ids).toEqual(["openrouter"])
  })

  it("keeps Neo in the connected list when auth exists", () => {
    const ids = visibleConnectedIds(["neo", "openrouter"], { neo: "oauth", openrouter: "api" })

    expect(ids).toEqual(["neo", "openrouter"])
  })

  it("leaves non-Neo providers untouched", () => {
    const ids = visibleConnectedIds(["anthropic"], {})

    expect(ids).toEqual(["anthropic"])
  })
})

describe("disabledProviderOptions", () => {
  it("includes Neo and excludes already disabled providers", () => {
    const options = disabledProviderOptions(
      {
        neo: { id: "neo", name: "Neo Gateway", env: [], models: {} },
        openai: { id: "openai", name: "OpenAI", env: [], models: {} },
        anthropic: { id: "anthropic", name: "Anthropic", env: [], models: {} },
      },
      ["openai"],
    )

    expect(options).toEqual([
      { value: "anthropic", label: "Anthropic" },
      { value: "neo", label: "Neo Gateway" },
    ])
  })

  it("sorts options by provider name", () => {
    const options = disabledProviderOptions(
      {
        zed: { id: "zed", name: "Zed", env: [], models: {} },
        alpha: { id: "alpha", name: "Alpha", env: [], models: {} },
      },
      [],
    )

    expect(options).toEqual([
      { value: "alpha", label: "Alpha" },
      { value: "zed", label: "Zed" },
    ])
  })
})

describe("providersWithNeoFallback", () => {
  it("adds Neo when backend providers omit it", () => {
    const providers = providersWithNeoFallback({
      anthropic: { id: "anthropic", name: "Anthropic", env: [], models: {} },
    })

    expect(providers.neo?.name).toBe("Neo Gateway")
    expect(providers.anthropic?.name).toBe("Anthropic")
  })

  it("keeps the backend Neo provider when present", () => {
    const providers = providersWithNeoFallback({
      neo: { id: "neo", name: "Custom Neo Name", env: [], models: {} },
    })

    expect(providers.neo?.name).toBe("Custom Neo Name")
  })
})
