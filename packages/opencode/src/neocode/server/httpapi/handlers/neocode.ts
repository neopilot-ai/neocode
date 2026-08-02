import { Effect } from "effect"
import { HttpApiBuilder, HttpApiError } from "effect/unstable/httpapi"
import * as NeoAgent from "@/neocode/agent"
import * as NeoSkill from "@/neocode/skill-remove"
import { Agent } from "@/agent/agent"
import { Config } from "@/config/config"
import { InstanceState } from "@/effect/instance-state"
import { HeapSnapshot } from "@/neocode/cli/heap-snapshot"
import type { RequestID as AgentManagerRequestID } from "@/neocode/agent-manager/protocol"
import { AgentManager } from "@/neocode/agent-manager/service"
import type { RequestID as NotebookRequestID } from "@/neocode/notebook/protocol"
import { Notebook } from "@/neocode/notebook/service"
import { ModelUsage } from "@/neocode/session/model-usage"
import { InstanceStore } from "@/project/instance-store"
import { InstanceHttpApi } from "@/server/routes/instance/httpapi/api"
import { Skill } from "@/skill"
import type { SessionID } from "@/session/schema"
import {
  AgentManagerRejectPayload,
  AgentManagerReplyPayload,
  NotebookRejectPayload,
  NotebookReplyPayload,
  RemoveAgentPayload,
  RemoveSkillPayload,
} from "../groups/neocode"

export const neocodeHandlers = HttpApiBuilder.group(InstanceHttpApi, "neocode", (handlers) =>
  Effect.gen(function* () {
    const agents = yield* Agent.Service
    const skills = yield* Skill.Service
    const config = yield* Config.Service
    const store = yield* InstanceStore.Service
    const manager = yield* AgentManager.Service
    const notebook = yield* Notebook.Service

    const heapSnapshot = Effect.fn("NeocodeHttpApi.heapSnapshot")(function* () {
      return yield* Effect.sync(() => HeapSnapshot.write())
    })

    const agentRequirements = Effect.fn("NeocodeHttpApi.agentRequirements")(function* (ctx: {
      query: { agent: string }
    }) {
      return yield* agents.requirementStatus(ctx.query.agent)
    })

    const removeSkill = Effect.fn("NeocodeHttpApi.removeSkill")(function* (ctx: {
      payload: typeof RemoveSkillPayload.Type
    }) {
      const instance = yield* InstanceState.context
      const entries = yield* skills.all()
      yield* Effect.tryPromise({
        try: () => NeoSkill.remove(ctx.payload.location, entries),
        catch: () => new HttpApiError.BadRequest({}),
      })
      yield* store.dispose(instance)
      return true
    })

    const removeAgent = Effect.fn("NeocodeHttpApi.removeAgent")(function* (ctx: {
      payload: typeof RemoveAgentPayload.Type
    }) {
      const instance = yield* InstanceState.context
      const agent = yield* agents.get(ctx.payload.name)
      const dirs = yield* config.directories()
      yield* Effect.tryPromise({
        try: () => NeoAgent.remove({ name: ctx.payload.name, agent, dirs, directory: instance.directory }),
        catch: (err) => err,
      }).pipe(
        Effect.catch((err) => {
          if (NeoAgent.RemoveError.isInstance(err)) return Effect.fail(new HttpApiError.BadRequest({}))
          return Effect.die(err)
        }),
      )
      yield* store.dispose(instance)
      return true
    })

    const notebookList = Effect.fn("NeocodeHttpApi.notebookList")(function* () {
      return yield* notebook.list()
    })

    const notebookReply = Effect.fn("NeocodeHttpApi.notebookReply")(function* (ctx: {
      params: { requestID: NotebookRequestID }
      payload: typeof NotebookReplyPayload.Type
    }) {
      yield* notebook.reply({ requestID: ctx.params.requestID, result: ctx.payload.result }).pipe(
        Effect.catchTag("Notebook.NotFoundError", () => Effect.fail(new HttpApiError.NotFound({}))),
        Effect.catchTag("Notebook.InvalidReplyError", () => Effect.fail(new HttpApiError.BadRequest({}))),
      )
      return true
    })

    const notebookReject = Effect.fn("NeocodeHttpApi.notebookReject")(function* (ctx: {
      params: { requestID: NotebookRequestID }
      payload: typeof NotebookRejectPayload.Type
    }) {
      yield* notebook
        .reject({ requestID: ctx.params.requestID, error: ctx.payload.error })
        .pipe(Effect.catchTag("Notebook.NotFoundError", () => Effect.fail(new HttpApiError.NotFound({}))))
      return true
    })

    const agentManagerList = Effect.fn("NeocodeHttpApi.agentManagerList")(function* () {
      return yield* manager.list()
    })

    const agentManagerReply = Effect.fn("NeocodeHttpApi.agentManagerReply")(function* (ctx: {
      params: { requestID: AgentManagerRequestID }
      payload: typeof AgentManagerReplyPayload.Type
    }) {
      yield* manager.reply({ requestID: ctx.params.requestID, result: ctx.payload.result }).pipe(
        Effect.catchTag("AgentManager.NotFoundError", () => Effect.fail(new HttpApiError.NotFound({}))),
        Effect.catchTag("AgentManager.InvalidReplyError", () => Effect.fail(new HttpApiError.BadRequest({}))),
      )
      return true
    })

    const agentManagerReject = Effect.fn("NeocodeHttpApi.agentManagerReject")(function* (ctx: {
      params: { requestID: AgentManagerRequestID }
      payload: typeof AgentManagerRejectPayload.Type
    }) {
      yield* manager
        .reject({ requestID: ctx.params.requestID, error: ctx.payload.error })
        .pipe(Effect.catchTag("AgentManager.NotFoundError", () => Effect.fail(new HttpApiError.NotFound({}))))
      return true
    })

    const sessionModelUsage = Effect.fn("NeocodeHttpApi.sessionModelUsage")(function* (ctx: {
      params: { sessionID: SessionID }
    }) {
      const usage = yield* ModelUsage.get(ctx.params.sessionID)
      if (!usage) return yield* new HttpApiError.NotFound({})
      return usage
    })

    return handlers
      .handle("heapSnapshot", heapSnapshot)
      .handle("agentRequirements", agentRequirements)
      .handle("removeSkill", removeSkill)
      .handle("removeAgent", removeAgent)
      .handle("notebookList", notebookList)
      .handle("notebookReply", notebookReply)
      .handle("notebookReject", notebookReject)
      .handle("agentManagerList", agentManagerList)
      .handle("agentManagerReply", agentManagerReply)
      .handle("agentManagerReject", agentManagerReject)
      .handle("sessionModelUsage", sessionModelUsage)
  }),
)
