import { Config, ConfigProvider, Context, Effect, Layer, Option } from "effect"
import { ConfigService } from "@/effect/config-service"

const bool = (name: string) => Config.boolean(name).pipe(Config.withDefault(false))
const positiveInteger = (name: string) =>
  Config.number(name).pipe(
    Config.map((value) => (Number.isInteger(value) && value > 0 ? value : undefined)),
    Config.orElse(() => Config.succeed(undefined)),
  )
const experimental = bool("NEO_EXPERIMENTAL")
const enabledByExperimental = (name: string) =>
  Config.all({ experimental, enabled: Config.boolean(name).pipe(Config.option) }).pipe(
    Config.map((flags) => Option.getOrElse(flags.enabled, () => flags.experimental)),
  )

export class Service extends ConfigService.Service<Service>()("@opencode/RuntimeFlags", {
  autoShare: bool("NEO_AUTO_SHARE"),
  pure: bool("NEO_PURE"),
  disableDefaultPlugins: bool("NEO_DISABLE_DEFAULT_PLUGINS"),
  disableChannelDb: bool("NEO_DISABLE_CHANNEL_DB"), // neocode_change
  disableEmbeddedWebUi: bool("NEO_DISABLE_EMBEDDED_WEB_UI"),
  disableExternalSkills: bool("NEO_DISABLE_EXTERNAL_SKILLS"),
  disableLspDownload: bool("NEO_DISABLE_LSP_DOWNLOAD"),
  skipMigrations: bool("NEO_SKIP_MIGRATIONS"), // neocode_change
  disableClaudeCodePrompt: Config.all({
    broad: bool("NEO_DISABLE_CLAUDE_CODE"),
    direct: bool("NEO_DISABLE_CLAUDE_CODE_PROMPT"),
  }).pipe(Config.map((flags) => flags.broad || flags.direct)),
  disableClaudeCodeSkills: Config.all({
    broad: bool("NEO_DISABLE_CLAUDE_CODE"),
    direct: bool("NEO_DISABLE_CLAUDE_CODE_SKILLS"),
  }).pipe(Config.map((flags) => flags.broad || flags.direct)),
  enableExa: Config.all({
    experimental,
    enabled: bool("NEO_ENABLE_EXA"),
    legacy: bool("NEO_EXPERIMENTAL_EXA"),
  }).pipe(Config.map((flags) => flags.experimental || flags.enabled || flags.legacy)),
  enableParallel: Config.all({
    enabled: bool("NEO_ENABLE_PARALLEL"),
    legacy: bool("NEO_EXPERIMENTAL_PARALLEL"),
  }).pipe(Config.map((flags) => flags.enabled || flags.legacy)),
  enableExperimentalModels: bool("NEO_ENABLE_EXPERIMENTAL_MODELS"),
  enableQuestionTool: bool("NEO_ENABLE_QUESTION_TOOL"),
  experimentalScout: enabledByExperimental("NEO_EXPERIMENTAL_SCOUT"), // neocode_change
  experimentalReferences: enabledByExperimental("NEO_EXPERIMENTAL_REFERENCES"),
  experimentalBackgroundSubagents: enabledByExperimental("NEO_EXPERIMENTAL_BACKGROUND_SUBAGENTS"),
  experimentalLspTy: bool("NEO_EXPERIMENTAL_LSP_TY"),
  experimentalLspTool: enabledByExperimental("NEO_EXPERIMENTAL_LSP_TOOL"),
  experimentalOxfmt: enabledByExperimental("NEO_EXPERIMENTAL_OXFMT"),
  experimentalPlanMode: enabledByExperimental("NEO_EXPERIMENTAL_PLAN_MODE"),
  experimentalEventSystem: enabledByExperimental("NEO_EXPERIMENTAL_EVENT_SYSTEM"),
  experimentalSessionSwitcher: enabledByExperimental("NEO_EXPERIMENTAL_SESSION_SWITCHER"), // neocode_change
  experimentalWorkspaces: enabledByExperimental("NEO_EXPERIMENTAL_WORKSPACES"),
  experimentalIconDiscovery: enabledByExperimental("NEO_EXPERIMENTAL_ICON_DISCOVERY"),
  outputTokenMax: positiveInteger("NEO_EXPERIMENTAL_OUTPUT_TOKEN_MAX"),
  bashDefaultTimeoutMs: positiveInteger("NEO_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS"),
  experimentalNativeLlm: bool("NEO_EXPERIMENTAL_NATIVE_LLM"),
  experimentalWebSockets: bool("NEO_EXPERIMENTAL_WEBSOCKETS"),
  client: Config.string("NEO_CLIENT").pipe(Config.withDefault("cli")),
}) {}

export type Info = Context.Service.Shape<typeof Service>

const emptyConfigLayer = Service.defaultLayer.pipe(
  Layer.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({}))),
  Layer.orDie,
)

export const layer = (overrides: Partial<Info> = {}) =>
  Layer.effect(
    Service,
    Effect.gen(function* () {
      const flags = yield* Service
      return Service.of({ ...flags, ...overrides })
    }),
  ).pipe(Layer.provide(emptyConfigLayer))

export const defaultLayer = Service.defaultLayer.pipe(Layer.orDie)

export const node = LayerNode.make(defaultLayer, [])

export * as RuntimeFlags from "./runtime-flags"
import { LayerNode } from "@opencode-ai/core/effect/layer-node"
