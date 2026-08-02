import { createNeo, NEO_OPENROUTER_BASE } from "@neocode/neo-gateway" // neocode_change
import { Effect } from "effect"
import { PluginV2 } from "../../plugin"
import { ProviderV2 } from "../../provider" // neocode_change

const id = ProviderV2.ID.make("neo") // neocode_change

export const NeoPlugin = PluginV2.define({
  id: PluginV2.ID.make("neo"),
  effect: Effect.gen(function* () {
    return {
      "catalog.transform": Effect.fn(function* (evt) {
        for (const item of evt.provider.list()) {
          if (item.provider.id !== id) continue // neocode_change
          evt.provider.update(item.provider.id, (provider) => {
            // neocode_change start
            const options = provider.request.body
            const token = options.neocodeToken ?? options.apiKey ?? process.env.NEO_API_KEY
            const org = process.env.NEO_ORG_ID ?? options.neocodeOrganizationId

            provider.api = {
              type: "aisdk",
              package: "@neocode/neo-gateway",
              url: NEO_OPENROUTER_BASE,
            }
            // neocode_change end
            provider.request.headers["HTTP-Referer"] = "https://neo.khulnasoft.com/"
            // neocode_change start
            provider.request.headers["X-Title"] = "Neo Code"
            options.neocodeToken = token ?? "anonymous"
            if (org) options.neocodeOrganizationId = org
            if (!provider.enabled) provider.enabled = { via: "custom", data: { anonymous: true } }
            // neocode_change end
          })
        }
      }),
      // neocode_change start
      "aisdk.sdk": Effect.fn(function* (evt) {
        if (evt.model.providerID !== id) return
        evt.sdk = createNeo(evt.options)
      }),
      // neocode_change end
    }
  }),
})
