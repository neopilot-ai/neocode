import type { Model, Provider } from "@neocode/sdk/v2/client"

export function hasGateway(providers: Pick<Provider, "id">[]) {
  return providers.some((provider) => provider.id === "neo")
}

export function visible(
  provider: Pick<Provider, "id">,
  model: Pick<Model, "mayTrainOnYourPrompts">,
  privacy: boolean,
) {
  return !privacy || provider.id !== "neo" || model.mayTrainOnYourPrompts !== true
}
