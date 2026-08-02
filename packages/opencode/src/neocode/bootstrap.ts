import { Cause, Context, Effect, Layer } from "effect"
import { EffectBridge } from "@/effect/bridge"
import { NeoSessions } from "@/neo-sessions/neo-sessions"
import * as Log from "@opencode-ai/core/util/log"
import { Global } from "@opencode-ai/core/global"
import { InstallationVersion } from "@opencode-ai/core/installation/version"
import path from "node:path"
import { Bus } from "@/bus"
import { Provider } from "@/provider/provider"
import { Session } from "@/session/session"
import { SessionSummary } from "@/session/summary"
import { SessionExport } from "@/neocode/session-export"
import { createWorkspaceProvider } from "@/neocode/session-export/workspace-provider"
import { Instance } from "@/neocode/instance"
import { Identity } from "@neocode/neo-telemetry"
import { MemoryLifecycle } from "@/neocode/memory/turn"
import { MemoryService } from "@neocode/neo-memory/effect/service"
import { MemoryEvents } from "@/neocode/memory/events"
import { installMemoryRuntime } from "@/neocode/memory/runtime"
import { NeoToolRegistry } from "@/neocode/tool/registry"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"

const log = Log.create({ service: "neocode-bootstrap" })

export namespace NeocodeBootstrap {
  export interface Interface {
    readonly init: () => Effect.Effect<void, unknown>
  }

  export class Service extends Context.Service<Service, Interface>()("@neocode/Bootstrap") {}

  export const layer = Layer.effect(
    Service,
    Effect.gen(function* () {
      // Bind the package memory effect layer to opencode (paths, instance binder, logger, event sink).
      installMemoryRuntime()
      const neo = yield* NeoSessions.Service
      const bus = yield* Bus.Service
      const sessions = yield* Session.Service
      const summary = yield* SessionSummary.Service
      const provider = yield* Provider.Service
      const memory = yield* MemoryService.Service

      const init = Effect.fn("NeocodeBootstrap.init")(function* () {
        yield* neo.init()
        yield* MemoryLifecycle.subscribe({ bus, sessions, summary, provider, memory })
        // Invalidate enabled cache on every memory state mutation (properties.directory holds the memory root).
        yield* bus.subscribeCallback(MemoryEvents.Status, (evt) =>
          NeoToolRegistry.invalidateMemoryEnabled(evt.properties.directory),
        )
        yield* bus.subscribeCallback(MemoryEvents.Updated, (evt) =>
          NeoToolRegistry.invalidateMemoryEnabled(evt.properties.directory),
        )
        // neocode_change start - session export bootstrap
        yield* Effect.gen(function* () {
          if (!SessionExport.enabled) return
          const anon = yield* EffectBridge.fromPromise(() =>
            Identity.getMachineId().catch((err) => {
              log.warn("session export identity failed", { err })
              return undefined
            }),
          )
          SessionExport.init({
            agentVersion: InstallationVersion,
            anonId: anon,
            dbPath: path.join(Global.Path.data, "session-export.db"),
            workspaceKey: Instance.directory,
            subscribeAll: (cb) => Bus.subscribeAll(cb),
            snapshotProvider: createWorkspaceProvider({
              root: Instance.directory,
              statePath: path.join(Global.Path.data, "session-export-workspace.json"),
            }),
          })
        }).pipe(
          Effect.catchCause((cause) =>
            Effect.sync(() => log.warn("session export bootstrap failed", { err: Cause.squash(cause) })),
          ),
        )
        // neocode_change end
        yield* EffectBridge.fromPromise(() =>
          import("@/neocode/indexing").then((mod) => mod.NeoIndexing.init()),
        ).pipe(
          Effect.catchCause((cause) =>
            Effect.sync(() => log.warn("indexing bootstrap failed", { err: Cause.squash(cause) })),
          ),
          Effect.forkDetach,
        )
      })

      return Service.of({ init })
    }),
  )

  export const defaultLayer = layer.pipe(
    Layer.provide([
      NeoSessions.defaultLayer,
      Session.defaultLayer,
      SessionSummary.defaultLayer,
      Provider.defaultLayer,
      MemoryService.layer,
      Bus.defaultLayer,
    ]),
  )

  const memory = LayerNode.make(MemoryService.layer, [])
  export const node = LayerNode.make(layer, [
    NeoSessions.node,
    Session.node,
    SessionSummary.node,
    Provider.node,
    memory,
    Bus.node,
  ])
}
