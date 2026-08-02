import { describe, expect } from "bun:test"
import { Effect } from "effect"
import { Catalog } from "@opencode-ai/core/catalog"
import { Credential } from "@opencode-ai/core/credential"
import { PluginV2 } from "@opencode-ai/core/plugin"
import { ProviderPlugins } from "@opencode-ai/core/plugin/provider"
import { NeoPlugin } from "@opencode-ai/core/plugin/provider/neo"
import { ProviderV2 } from "@opencode-ai/core/provider"
import { expectPluginRegistered, it, model, provider, withEnv } from "./provider-helper" // neocode_change

describe("NeoPlugin", () => {
  it.effect("is registered so legacy referer headers can be applied", () =>
    Effect.sync(() =>
      expectPluginRegistered(
        ProviderPlugins.map((item) => item.id),
        "neo",
      ),
    ),
  )

  it.effect("applies legacy referer headers only to neo", () =>
    Effect.gen(function* () {
      const plugin = yield* PluginV2.Service
      const catalog = yield* Catalog.Service
      yield* plugin.add(NeoPlugin)
      const transform = yield* catalog.transform()
      yield* transform((catalog) => {
        const neo = provider("neo", {
          api: { type: "aisdk", package: "@ai-sdk/openai-compatible", url: "https://api.neo.khulnasoft.com/api/gateway" },
          request: { headers: { Existing: "value" }, body: {} },
        })
        catalog.provider.update(neo.id, (draft) => {
          draft.api = neo.api
          draft.request = neo.request
        })
        catalog.provider.update(provider("openrouter").id, () => {})
      })
      expect((yield* catalog.provider.get(ProviderV2.ID.make("neo"))).request.headers).toEqual({
        Existing: "value",
        "HTTP-Referer": "https://neo.khulnasoft.com/",
        "X-Title": "Neo Code", // neocode_change
      })
      expect((yield* catalog.provider.get(ProviderV2.ID.openrouter)).request.headers).toEqual({})
    }),
  )

  it.effect("uses the exact legacy Neo header casing and set", () =>
    Effect.gen(function* () {
      const plugin = yield* PluginV2.Service
      const catalog = yield* Catalog.Service
      yield* plugin.add(NeoPlugin)
      const transform = yield* catalog.transform()
      yield* transform((catalog) => {
        const item = provider("neo", {
          api: { type: "aisdk", package: "@ai-sdk/openai-compatible", url: "https://api.neo.khulnasoft.com/api/gateway" },
        })
        catalog.provider.update(item.id, (draft) => {
          draft.api = item.api
        })
      })

      const result = yield* catalog.provider.get(ProviderV2.ID.make("neo"))
      expect(result.request.headers).toEqual({
        "HTTP-Referer": "https://neo.khulnasoft.com/",
        "X-Title": "Neo Code", // neocode_change
      })
      expect(result.request.headers).not.toHaveProperty("http-referer")
      expect(result.request.headers).not.toHaveProperty("x-title")
      expect(result.request.headers).not.toHaveProperty("X-Source")
    }),
  )

  it.effect("uses the legacy provider-id guard instead of endpoint package matching", () =>
    Effect.gen(function* () {
      const plugin = yield* PluginV2.Service
      const catalog = yield* Catalog.Service
      yield* plugin.add(NeoPlugin)
      const transform = yield* catalog.transform()
      yield* transform((catalog) => {
        const neo = provider("neo", {
          api: { type: "aisdk", package: "@ai-sdk/openai-compatible", url: "https://api.neo.khulnasoft.com/api/gateway" },
        })
        catalog.provider.update(neo.id, (draft) => {
          draft.api = neo.api
        })
        const custom = provider("custom-neo", {
          api: { type: "aisdk", package: "neo" },
        })
        catalog.provider.update(custom.id, (draft) => {
          draft.api = custom.api
        })
      })

      expect((yield* catalog.provider.get(ProviderV2.ID.make("neo"))).request.headers).toEqual({
        "HTTP-Referer": "https://neo.khulnasoft.com/",
        "X-Title": "Neo Code", // neocode_change
      })
      expect((yield* catalog.provider.get(ProviderV2.ID.make("custom-neo"))).request.headers).toEqual({})
    }),
  )

  // neocode_change start
  it.effect("routes the Neo catalog through the Neo Gateway SDK", () =>
    withEnv({ NEO_API_KEY: undefined, NEO_ORG_ID: undefined }, () =>
      Effect.gen(function* () {
        const plugin = yield* PluginV2.Service
        const catalog = yield* Catalog.Service
        yield* plugin.add(NeoPlugin)
        const transform = yield* catalog.transform()
        yield* transform((catalog) => {
          const item = provider("neo", {
            api: { type: "aisdk", package: "@ai-sdk/openai-compatible", url: "https://api.neo.khulnasoft.com/api/gateway" },
            request: { headers: {}, body: { apiKey: "stored-token" } },
          })
          catalog.provider.update(item.id, (draft) => {
            draft.api = item.api
            draft.request = item.request
          })
        })
        const updated = yield* catalog.provider.get(ProviderV2.ID.make("neo"))

        expect(updated.api).toEqual({
          type: "aisdk",
          package: "@neocode/neo-gateway",
          url: "https://api.neo.khulnasoft.com/api/openrouter",
        })
        expect(updated.request.body.neocodeToken).toBe("stored-token")

        const result = yield* plugin.trigger(
          "aisdk.sdk",
          {
            model: model("neo", "neo-auto/free"),
            package: "@neocode/neo-gateway",
            options: updated.request.body,
          },
          {},
        )
        expect(result.sdk).toBeDefined()
        expect(typeof result.sdk.languageModel).toBe("function")
        expect(typeof result.sdk.anthropic).toBe("function")
      }),
    ),
  )

  it.effect("keeps authenticated credentials ahead of inherited environment keys", () =>
    withEnv({ NEO_API_KEY: "environment-token", NEO_ORG_ID: "environment-org" }, () =>
      Effect.gen(function* () {
        const plugin = yield* PluginV2.Service
        const catalog = yield* Catalog.Service
        yield* plugin.add(NeoPlugin)
        const transform = yield* catalog.transform()
        yield* transform((catalog) => {
          const item = provider("neo", {
            enabled: { via: "credential", credentialID: Credential.ID.make("cred_neo") },
            request: {
              headers: {},
              body: { apiKey: "authenticated-token", neocodeOrganizationId: "authenticated-org" },
            },
          })
          catalog.provider.update(item.id, (draft) => {
            draft.enabled = item.enabled
            draft.request = item.request
          })
        })
        const result = yield* catalog.provider.get(ProviderV2.ID.make("neo"))

        expect(result.enabled).toEqual({ via: "credential", credentialID: Credential.ID.make("cred_neo") })
        expect(result.request.body.neocodeToken).toBe("authenticated-token")
        expect(result.request.body.neocodeOrganizationId).toBe("environment-org")
      }),
    ),
  )

  it.effect("keeps anonymous Neo models available without credentials", () =>
    withEnv({ NEO_API_KEY: undefined, NEO_ORG_ID: undefined }, () =>
      Effect.gen(function* () {
        const plugin = yield* PluginV2.Service
        const catalog = yield* Catalog.Service
        yield* plugin.add(NeoPlugin)
        const transform = yield* catalog.transform()
        yield* transform((catalog) => catalog.provider.update(ProviderV2.ID.make("neo"), () => {}))
        const result = yield* catalog.provider.get(ProviderV2.ID.make("neo"))

        expect(result.enabled).toEqual({ via: "custom", data: { anonymous: true } })
        expect(result.request.body.neocodeToken).toBe("anonymous")
      }),
    ),
  )
  // neocode_change end
})
