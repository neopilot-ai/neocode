import { Schema } from "effect"
import { HttpApi } from "effect/unstable/httpapi"
import { InstanceDisposed } from "@/server/event"
import { Question } from "@/question"
import { BusEvent } from "@/bus/bus-event" // neocode_change - include legacy Neo events until they migrate to EventV2
import { ConfigApi } from "./groups/config"
import { ControlApi } from "./groups/control"
import { ControlPlaneApi } from "./groups/control-plane"
import { EventApi } from "./groups/event"
import { ExperimentalApi } from "./groups/experimental"
import { FileApi } from "./groups/file"
import { InstanceApi } from "./groups/instance"
import { McpApi } from "./groups/mcp"
import { PermissionApi } from "./groups/permission"
import { ProjectApi } from "./groups/project"
import { ProjectCopyApi } from "./groups/project-copy"
import { ProviderApi } from "./groups/provider"
import { PtyApi, PtyConnectApi } from "./groups/pty"
import { QuestionApi } from "./groups/question"
import { SessionApi } from "./groups/session"
import { SyncApi } from "./groups/sync"
import { TuiApi } from "./groups/tui"
import { WorkspaceApi } from "./groups/workspace"
import { Api } from "@opencode-ai/server/api"
// neocode_change start - Neo HttpApi groups
import { AgentBuilderApi } from "@/neocode/server/httpapi/groups/agent-builder"
import { BranchNameApi } from "@/neocode/server/httpapi/groups/branch-name"
import { CommitMessageApi } from "@/neocode/server/httpapi/groups/commit-message"
import { BackgroundProcessApi } from "@/neocode/server/httpapi/groups/background-process"
import { ConfigConsoleApi } from "@/neocode/server/httpapi/groups/config-console"
import { EnhancePromptApi } from "@/neocode/server/httpapi/groups/enhance-prompt"
import { IndexingApi } from "@/neocode/server/httpapi/groups/indexing"
import { InstanceReloadApi } from "@/neocode/server/httpapi/groups/instance-reload"
import { InteractiveTerminalApi } from "@/neocode/server/httpapi/groups/interactive-terminal"
import { NeoGatewayApi } from "@/neocode/server/httpapi/groups/neo-gateway"
import { NeocodeApi } from "@/neocode/server/httpapi/groups/neocode"
import { NetworkApi } from "@/neocode/server/httpapi/groups/network"
import { RemoteApi } from "@/neocode/server/httpapi/groups/remote"
import { SandboxApi } from "@/neocode/server/httpapi/groups/sandbox"
import { SessionImportApi } from "@/neocode/server/httpapi/groups/session-import"
import { SuggestionApi } from "@/neocode/server/httpapi/groups/suggestion"
import { TelemetryApi } from "@/neocode/server/httpapi/groups/telemetry"
import { MemoryApi } from "@/neocode/server/httpapi/groups/memory" // neocode_change
// neocode_change end
// GlobalEventSchema snapshots the registry after event-producing groups register their variants.
import { GlobalApi } from "./groups/global"
import { Authorization } from "./middleware/authorization"
import { SchemaErrorMiddleware } from "./middleware/schema-error"

const EventSchema = Schema.Union([...BusEvent.effectPayloads(), InstanceDisposed]).annotate({ identifier: "Event" }) // neocode_change

export const RootHttpApi = HttpApi.make("opencode-root")
  .addHttpApi(ControlApi)
  .addHttpApi(ControlPlaneApi)
  .addHttpApi(GlobalApi)
  .middleware(SchemaErrorMiddleware)
  .middleware(Authorization)

export const InstanceHttpApi = HttpApi.make("opencode-instance")
  .addHttpApi(ConfigApi)
  .addHttpApi(ExperimentalApi)
  .addHttpApi(FileApi)
  .addHttpApi(InstanceApi)
  .addHttpApi(McpApi)
  .addHttpApi(ProjectApi)
  .addHttpApi(ProjectCopyApi)
  .addHttpApi(PtyApi)
  .addHttpApi(QuestionApi)
  .addHttpApi(PermissionApi)
  .addHttpApi(ProviderApi)
  .addHttpApi(SessionApi)
  .addHttpApi(SyncApi)
  .addHttpApi(TuiApi)
  .addHttpApi(WorkspaceApi)
  // neocode_change start - Neo HttpApi groups
  .addHttpApi(AgentBuilderApi)
  .addHttpApi(BackgroundProcessApi)
  .addHttpApi(BranchNameApi)
  .addHttpApi(CommitMessageApi)
  .addHttpApi(ConfigConsoleApi)
  .addHttpApi(EnhancePromptApi)
  .addHttpApi(IndexingApi)
  .addHttpApi(InstanceReloadApi)
  .addHttpApi(InteractiveTerminalApi)
  .addHttpApi(NeoGatewayApi)
  .addHttpApi(NeocodeApi)
  .addHttpApi(NetworkApi)
  .addHttpApi(RemoteApi)
  .addHttpApi(SandboxApi)
  .addHttpApi(SessionImportApi)
  .addHttpApi(SuggestionApi)
  .addHttpApi(TelemetryApi)
  .addHttpApi(MemoryApi)
  // neocode_change end
  .middleware(SchemaErrorMiddleware)

export const OpenCodeHttpApi = HttpApi.make("opencode")
  .addHttpApi(RootHttpApi)
  .addHttpApi(EventApi)
  .addHttpApi(InstanceHttpApi)
  .addHttpApi(Api)
  .addHttpApi(PtyConnectApi)
  .annotate(HttpApi.AdditionalSchemas, [EventSchema, Question.Replied, Question.Rejected])

export type RootHttpApiType = typeof RootHttpApi
export type InstanceHttpApiType = typeof InstanceHttpApi
