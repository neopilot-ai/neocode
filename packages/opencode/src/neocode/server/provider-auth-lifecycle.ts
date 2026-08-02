import { InstanceStore } from "@/project/instance-store"
import { ModelCache } from "@/provider/model-cache"
import { NeoViewers } from "@/neocode/presence/service" // neocode_change
import { Effect } from "effect"

export const disposeAllInstancesAfterProviderAuthCallback = Effect.fn(
  "NeoServer.disposeAllInstancesAfterProviderAuthCallback",
)(function* () {
  const store = yield* InstanceStore.Service
  yield* store.disposeAll()
})

// neocode_change start - drop the old presence socket; callers invoke this for the "neo" provider only
export const invalidatePresence = Effect.fn("NeoServer.invalidatePresence")(function* () {
  const viewers = yield* NeoViewers.Service
  yield* viewers.invalidateAuth()
})
// neocode_change end

export const invalidateAfterProviderAuthChange = Effect.fn("NeoServer.invalidateAfterProviderAuthChange")(function* (
  providerID: string,
) {
  const cache = yield* ModelCache.Service
  yield* cache.clear(providerID)
  yield* disposeAllInstancesAfterProviderAuthCallback()
})
