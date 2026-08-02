import { Config } from "@/config/config"
// neocode_change start - preserve Neo API default model overlay
import { fetchDefaultModel } from "@neocode/neo-gateway"
import { Auth } from "@/auth"
import { ProviderV2 } from "@opencode-ai/core/provider"
import { ModelV2 } from "@opencode-ai/core/model"
import { filterPromptTrainingModels, nonEmptyProviders } from "@/neocode/provider/model-filter"
// neocode_change end
import { Provider } from "@/provider/provider"
import * as InstanceState from "@/effect/instance-state"
import { Effect } from "effect"
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi" // neocode_change
import { InstanceHttpApi } from "../api"
import { markInstanceForDisposal } from "../lifecycle"

export const configHandlers = HttpApiBuilder.group(InstanceHttpApi, "config", (handlers) =>
  Effect.gen(function* () {
    const providerSvc = yield* Provider.Service
    const configSvc = yield* Config.Service

    const get = Effect.fn("ConfigHttpApi.get")(function* () {
      return yield* configSvc.get()
    })

    const update = Effect.fn("ConfigHttpApi.update")(function* (ctx) {
      yield* configSvc.update(ctx.payload)
      yield* markInstanceForDisposal(yield* InstanceState.context)
      return ctx.payload
    })

    // neocode_change start
    const warnings = Effect.fn("ConfigHttpApi.warnings")(function* () {
      return yield* configSvc.warnings()
    })
    // neocode_change end

    const providers = Effect.fn("ConfigHttpApi.providers")(function* () {
      // neocode_change start
      const config = yield* configSvc.get()
      const providers = filterPromptTrainingModels(
        yield* providerSvc.list(),
        config.hide_prompt_training_models === true,
      )
      const defaults = Provider.defaultModelIDs(nonEmptyProviders(providers))
      // neocode_change end

      // neocode_change start - Fetch default model from Neo API when the neo provider is available.
      if (providers[ProviderV2.ID.neo]) {
        const auth = yield* Auth.Service
        const info = yield* auth.get("neo").pipe(Effect.mapError(() => new HttpApiError.Unauthorized({}))) // neocode_change
        const token = info?.type === "oauth" ? info.access : info?.key
        const organizationId = info?.type === "oauth" ? info.accountId : undefined
        const model = yield* Effect.promise(() => fetchDefaultModel(token, organizationId))
        if (model && providers[ProviderV2.ID.neo]?.models[model]) defaults[ProviderV2.ID.neo] = ModelV2.ID.make(model)
      }
      // neocode_change end

      return {
        providers: Object.values(providers).map(Provider.toPublicInfo),
        default: defaults,
      }
    })

    return handlers
      .handle("get", get)
      .handle("update", update)
      .handle("warnings", warnings)
      .handle("providers", providers) // neocode_change
  }),
)
