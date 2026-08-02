import { afterEach, describe, expect, spyOn, test } from "bun:test"
import { Effect, Layer, Schema, Stream } from "effect"
import * as Log from "@opencode-ai/core/util/log"
import { Agent } from "../../src/agent/agent"
import { Bus } from "../../src/bus"
import { NeoIndexing } from "../../src/neocode/indexing"
import { NeocodeBootstrap } from "../../src/neocode/bootstrap"
import { NeoSessions } from "../../src/neo-sessions/neo-sessions"
import { NeoMemory } from "@neocode/neo-memory/effect"
import { MemoryService } from "@neocode/neo-memory/effect/service"
import { InstanceState } from "../../src/effect/instance-state"
import { NeoToolRegistry } from "../../src/neocode/tool/registry"
import { Provider } from "../../src/provider/provider"
import { ProviderV2 } from "@opencode-ai/core/provider"
import { ModelV2 } from "@opencode-ai/core/model"
import { Session } from "../../src/session/session"
import { SessionSummary } from "../../src/session/summary"
import { ToolRegistry } from "../../src/tool/registry"
import type * as Tool from "../../src/tool/tool"
import { disposeAllInstances, provideTmpdirInstance } from "../fixture/fixture"
import * as CrossSpawnSpawner from "@opencode-ai/core/cross-spawn-spawner"
import { testEffect } from "../lib/effect"

const node = CrossSpawnSpawner.defaultLayer
const it = testEffect(Layer.mergeAll(Agent.defaultLayer, ToolRegistry.defaultLayer, node))
const ref = {
  providerID: ProviderV2.ID.make("test"),
  modelID: ModelV2.ID.make("test-model"),
}

afterEach(async () => {
  await disposeAllInstances()
})

describe("neocode tool registry indexing", () => {
  const logger = Log.create({ service: "neocode-tool-registry" })

  it.live("omits semantic_search without waiting for slow indexing startup", () =>
    provideTmpdirInstance(
      () =>
        Effect.gen(function* () {
          const avail = spyOn(NeoIndexing, "available").mockImplementation(() => new Promise<boolean>(() => {}))

          try {
            const registry = yield* ToolRegistry.Service
            const ids = yield* registry.ids()

            expect(ids).not.toContain("semantic_search")
            expect(ids).not.toContain("codesearch")
            expect(ids).toContain("question")
            expect(ids).toContain("read")
            expect(ids).toContain("suggest")
            expect(avail).not.toHaveBeenCalled()
          } finally {
            avail.mockRestore()
          }
        }),
      { git: true },
    ),
  )

  it.live("registers semantic search from config even when readiness throws", () =>
    provideTmpdirInstance(
      () =>
        Effect.gen(function* () {
          const err = new Error("ready failed")
          const ready = spyOn(NeoIndexing, "ready").mockImplementation(() => {
            throw err
          })
          const warn = spyOn(logger, "warn").mockImplementation(() => {})

          try {
            const registry = yield* ToolRegistry.Service
            const ids = yield* registry.ids()

            expect(ids).toContain("semantic_search")
            expect(ids).toContain("question")
            expect(ids).toContain("read")
            expect(ids).toContain("suggest")
            expect(warn).not.toHaveBeenCalled()
          } finally {
            ready.mockRestore()
            warn.mockRestore()
          }
        }),
      { git: true, config: { indexing: { enabled: true } } },
    ),
  )

  it.live("registers semantic search from config even when readiness rejects", () =>
    provideTmpdirInstance(
      () =>
        Effect.gen(function* () {
          const err = new Error("ready rejected")
          const ready = spyOn(NeoIndexing, "ready").mockImplementation(() => Promise.reject(err) as unknown as boolean)
          const warn = spyOn(logger, "warn").mockImplementation(() => {})

          try {
            const registry = yield* ToolRegistry.Service
            const ids = yield* registry.ids()

            expect(ids).toContain("semantic_search")
            expect(ids).toContain("question")
            expect(ids).toContain("read")
            expect(ids).toContain("suggest")
            expect(warn).not.toHaveBeenCalled()
          } finally {
            ready.mockRestore()
            warn.mockRestore()
          }
        }),
      { git: true, config: { indexing: { enabled: true } } },
    ),
  )

  it.live("registers semantic_search when indexing is enabled", () =>
    provideTmpdirInstance(
      () =>
        Effect.gen(function* () {
          const ready = spyOn(NeoIndexing, "ready").mockReturnValue(true)

          try {
            const registry = yield* ToolRegistry.Service
            const ids = yield* registry.ids()

            expect(ids).toContain("semantic_search")
          } finally {
            ready.mockRestore()
          }
        }),
      { git: true, config: { indexing: { enabled: true } } },
    ),
  )

  it.live("omits semantic_search hint from glob and grep descriptions when indexing is not ready", () =>
    provideTmpdirInstance(
      () =>
        Effect.gen(function* () {
          const ready = spyOn(NeoIndexing, "ready").mockReturnValue(false)

          try {
            const agent = yield* Agent.Service
            const build = yield* agent.get("build")
            const registry = yield* ToolRegistry.Service
            const tools = yield* registry.tools({ ...ref, agent: build })
            const glob = tools.find((tool) => tool.id === "glob")?.description ?? ""
            const grep = tools.find((tool) => tool.id === "grep")?.description ?? ""

            expect(glob).not.toContain("semantic_search")
            expect(grep).not.toContain("semantic_search")
          } finally {
            ready.mockRestore()
          }
        }),
      { git: true },
    ),
  )

  it.live("includes semantic_search hint in glob and grep descriptions when indexing is enabled", () =>
    provideTmpdirInstance(
      () =>
        Effect.gen(function* () {
          const ready = spyOn(NeoIndexing, "ready").mockReturnValue(true)

          try {
            const agent = yield* Agent.Service
            const build = yield* agent.get("build")
            const registry = yield* ToolRegistry.Service
            const tools = yield* registry.tools({ ...ref, agent: build })
            const ids = tools.map((tool) => tool.id)
            const glob = tools.find((tool) => tool.id === "glob")?.description ?? ""
            const grep = tools.find((tool) => tool.id === "grep")?.description ?? ""

            expect(ids).toContain("semantic_search")
            expect(glob).toContain("semantic_search")
            expect(grep).toContain("semantic_search")
          } finally {
            ready.mockRestore()
          }
        }),
      { git: true, config: { indexing: { enabled: true } } },
    ),
  )

  it.live("omits interactive_terminal from subagent definitions", () =>
    Effect.acquireUseRelease(
      Effect.sync(() => {
        const prev = process.env["NEO_CLIENT"]
        process.env["NEO_CLIENT"] = "cli"
        return prev
      }),
      () =>
        provideTmpdirInstance(
          () =>
            Effect.gen(function* () {
              const agent = yield* Agent.Service
              const build = yield* agent.get("build")
              const explore = yield* agent.get("explore")
              const registry = yield* ToolRegistry.Service
              const primary = yield* registry.tools({ ...ref, agent: build })
              const subagent = yield* registry.tools({ ...ref, agent: explore })

              expect(primary.map((tool) => tool.id)).toContain("interactive_terminal")
              expect(subagent.map((tool) => tool.id)).not.toContain("interactive_terminal")
            }),
          {
            git: true,
            config: { permission: { interactive_terminal: "allow" } },
          },
        ),
      (prev) =>
        Effect.sync(() => {
          if (prev === undefined) delete process.env["NEO_CLIENT"]
          if (prev !== undefined) process.env["NEO_CLIENT"] = prev
        }),
    ),
  )

  test("enables semantic search from indexing configuration before the index is ready", () => {
    expect(
      NeoToolRegistry.indexing({
        indexing: { enabled: true },
      }),
    ).toBe(true)
    expect(
      NeoToolRegistry.indexing({
        indexing: { enabled: false },
      }),
    ).toBe(false)
    expect(NeoToolRegistry.indexing({}, { indexing: { enabled: true } })).toBe(true)
  })

  it.live("omits memory tools when project memory is disabled but keeps neo_local_recall", () =>
    provideTmpdirInstance(
      () =>
        Effect.gen(function* () {
          const agent = yield* Agent.Service
          const build = yield* agent.get("build")
          const registry = yield* ToolRegistry.Service
          const tools = yield* registry.tools({ ...ref, agent: build })
          const ids = tools.map((tool) => tool.id)

          expect(ids).not.toContain("neo_memory_recall")
          expect(ids).not.toContain("neo_memory_save")
          // neo_local_recall is a transcript-recall tool gated by `recall: "ask"` in agent
          // permissions; it must NOT be coupled to project-memory enablement.
          expect(ids).toContain("neo_local_recall")
        }),
      { git: true },
    ),
  )

  it.live("memoryToolsEnabled coalesces consecutive probes within the TTL", () =>
    provideTmpdirInstance(
      () =>
        Effect.gen(function* () {
          const ctx = yield* InstanceState.context
          const probe = spyOn(NeoMemory, "toolEnabled")

          try {
            const a = yield* NeoToolRegistry.memoryToolsEnabled({ ctx })
            const b = yield* NeoToolRegistry.memoryToolsEnabled({ ctx })
            const c = yield* NeoToolRegistry.memoryToolsEnabled({ ctx })

            expect([a, b, c]).toEqual([false, false, false])
            // Cache hit: only the first call should reach NeoMemory.toolEnabled.
            expect(probe).toHaveBeenCalledTimes(1)
          } finally {
            probe.mockRestore()
          }
        }),
      { git: true },
    ),
  )

  it.live("memoryToolsEnabled reflects enable/disable immediately after invalidate", () =>
    provideTmpdirInstance(
      () =>
        Effect.gen(function* () {
          const ctx = yield* InstanceState.context
          const root = (yield* Effect.promise(() => NeoMemory.prepare({ ctx }))).toString()

          const first = yield* NeoToolRegistry.memoryToolsEnabled({ ctx })
          expect(first).toBe(false)

          yield* Effect.promise(() => NeoMemory.enable({ ctx }))

          // The bootstrap MemoryEvents subscriber invalidates on mutation; call it directly here.
          NeoToolRegistry.invalidateMemoryEnabled(root)
          const afterEnable = yield* NeoToolRegistry.memoryToolsEnabled({ ctx })
          expect(afterEnable).toBe(true)

          yield* Effect.promise(() => NeoMemory.disable({ ctx }))

          NeoToolRegistry.invalidateMemoryEnabled(root)
          const afterDisable = yield* NeoToolRegistry.memoryToolsEnabled({ ctx })
          expect(afterDisable).toBe(false)
        }),
      { git: true },
    ),
  )

  it.live("includes memory tools when project memory is enabled", () =>
    provideTmpdirInstance(
      () =>
        Effect.gen(function* () {
          const ctx = yield* InstanceState.context
          yield* Effect.promise(() => NeoMemory.enable({ ctx }))

          const agent = yield* Agent.Service
          const build = yield* agent.get("build")
          const registry = yield* ToolRegistry.Service
          const tools = yield* registry.tools({ ...ref, agent: build })
          const ids = tools.map((tool) => tool.id)

          expect(ids).toContain("neo_memory_recall")
          expect(ids).toContain("neo_memory_save")
          expect(ids).toContain("neo_local_recall")
        }),
      { git: true },
    ),
  )

  test("conditionally includes Neo registry extras", () => {
    const prev = process.env["NEO_CLIENT"]
    const def = (id: string): Tool.Def => ({
      id,
      description: id,
      parameters: Schema.String,
      execute: () => Effect.succeed({ title: id, output: id, metadata: {} }),
    })
    const tools = {
      codebase: def("codebase_search"),
      semantic: def("semantic_search"),
      recall: def("recall"),
      managerModels: def("agent_manager_models"),
      memory: def("neo_memory_recall"),
      save: def("neo_memory_save"),
      manager: def("agent_manager"),
      process: def("background_process"),
      image: def("generate_image"),
      terminal: def("interactive_terminal"),
      notebookRead: def("notebook_read"),
      notebookEdit: def("notebook_edit"),
      notebookExecute: def("notebook_execute"),
    }

    try {
      process.env["NEO_CLIENT"] = "cli"
      expect(NeoToolRegistry.extra(tools, {}).map((tool) => tool.id)).toEqual([
        "semantic_search",
        "neo_memory_recall",
        "neo_memory_save",
        "recall",
        "background_process",
        "interactive_terminal",
      ])
      expect(NeoToolRegistry.extra(tools, { experimental: { codebase_search: true } }).map((tool) => tool.id)).toEqual(
        [
          "codebase_search",
          "semantic_search",
          "neo_memory_recall",
          "neo_memory_save",
          "recall",
          "background_process",
          "interactive_terminal",
        ],
      )
      expect(
        NeoToolRegistry.extra(tools, { experimental: { codebase_search: true, image_generation: true } }).map(
          (tool) => tool.id,
        ),
      ).toEqual([
        "codebase_search",
        "generate_image",
        "semantic_search",
        "neo_memory_recall",
        "neo_memory_save",
        "recall",
        "background_process",
        "interactive_terminal",
      ])

      process.env["NEO_CLIENT"] = "vscode"
      expect(NeoToolRegistry.extra(tools, { experimental: { codebase_search: true } }).map((tool) => tool.id)).toEqual(
        [
          "codebase_search",
          "semantic_search",
          "neo_memory_recall",
          "neo_memory_save",
          "recall",
          "background_process",
          "agent_manager_models",
          "agent_manager",
        ],
      )
      expect(
        NeoToolRegistry.extra(tools, {
          experimental: { codebase_search: true, native_notebook_tools: true },
        }).map((tool) => tool.id),
      ).toEqual([
        "codebase_search",
        "semantic_search",
        "neo_memory_recall",
        "neo_memory_save",
        "recall",
        "background_process",
        "agent_manager_models",
        "agent_manager",
        "notebook_read",
        "notebook_edit",
        "notebook_execute",
      ])
      expect(NeoToolRegistry.extra({ ...tools, semantic: undefined }, {}).map((tool) => tool.id)).toEqual([
        "neo_memory_recall",
        "neo_memory_save",
        "recall",
        "background_process",
        "agent_manager_models",
        "agent_manager",
      ])

      process.env["NEO_CLIENT"] = "desktop"
      expect(NeoToolRegistry.extra(tools, {}).map((tool) => tool.id)).toEqual([
        "semantic_search",
        "neo_memory_recall",
        "neo_memory_save",
        "recall",
      ])

      process.env["NEO_CLIENT"] = "run"
      expect(NeoToolRegistry.extra(tools, {}).map((tool) => tool.id)).toEqual([
        "semantic_search",
        "neo_memory_recall",
        "neo_memory_save",
        "recall",
      ])

      process.env["NEO_CLIENT"] = "acp"
      expect(NeoToolRegistry.extra(tools, {}).map((tool) => tool.id)).toEqual([
        "semantic_search",
        "neo_memory_recall",
        "neo_memory_save",
        "recall",
      ])
    } finally {
      if (prev === undefined) delete process.env["NEO_CLIENT"]
      if (prev !== undefined) process.env["NEO_CLIENT"] = prev
    }
  })

  test("logs indexing bootstrap failures without blocking session bootstrap", async () => {
    const logger = Log.create({ service: "neocode-bootstrap" })
    const err = new Error("indexing init failed")
    const calls: string[] = []
    const sessions = Layer.succeed(
      NeoSessions.Service,
      NeoSessions.Service.of({ init: () => Effect.sync(() => calls.push("sessions")) }),
    )
    const bus = Layer.succeed(
      Bus.Service,
      Bus.Service.of({
        publish: () => Effect.void,
        subscribe: () => Effect.succeed(Stream.empty),
        subscribeAll: () => Effect.succeed(Stream.empty),
        subscribeCallback: () => Effect.succeed(() => {}),
        subscribeAllCallback: () => Effect.succeed(() => {}),
      }),
    )
    const memory = Layer.succeed(MemoryService.Service, MemoryService.make())
    const session = Layer.succeed(Session.Service, {} as Session.Interface)
    const summary = Layer.succeed(SessionSummary.Service, {} as SessionSummary.Interface)
    const provider = Layer.succeed(Provider.Service, {} as Provider.Interface)
    const indexing = spyOn(NeoIndexing, "init").mockRejectedValue(err)
    const warn = spyOn(logger, "warn").mockImplementation(() => {})

    try {
      await Effect.runPromise(
        NeocodeBootstrap.Service.use((svc) => svc.init()).pipe(
          Effect.provide(
            NeocodeBootstrap.layer.pipe(Layer.provide([sessions, bus, memory, session, summary, provider])),
          ),
          Effect.scoped,
        ),
      )
      await new Promise((resolve) => setTimeout(resolve, 0))

      expect(calls).toEqual(["sessions"])
      expect(indexing).toHaveBeenCalledTimes(1)
      expect(warn).toHaveBeenCalledWith("indexing bootstrap failed", { err })
    } finally {
      indexing.mockRestore()
      warn.mockRestore()
    }
  })
})
