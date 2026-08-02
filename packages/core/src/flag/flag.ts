import { Config } from "effect"
import { InstallationChannel } from "../installation/version" // neocode_change

export function truthy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "true" || value === "1"
}

// neocode_change start
function falsy(key: string) {
  const value = process.env[key]?.toLowerCase()
  return value === "false" || value === "0"
}

const UNSTABLE_CHANNELS = new Set(["dev", "beta", "local"])
function unstableDefault(key: string) {
  return truthy(key) || (!falsy(key) && UNSTABLE_CHANNELS.has(InstallationChannel))
}

function number(key: string) {
  const value = process.env[key]
  if (!value) return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

const NEO_EXPERIMENTAL = truthy("NEO_EXPERIMENTAL")
const NEO_DISABLE_CLAUDE_CODE = truthy("NEO_DISABLE_CLAUDE_CODE")
const NEO_DISABLE_CLAUDE_CODE_SKILLS = NEO_DISABLE_CLAUDE_CODE || truthy("NEO_DISABLE_CLAUDE_CODE_SKILLS")
// neocode_change end
const copy = process.env["NEO_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"]
const fff = process.env["NEO_DISABLE_FFF"]

function enabledByExperimental(key: string) {
  return process.env[key] === undefined ? truthy("NEO_EXPERIMENTAL") : truthy(key)
}

export const Flag = {
  OTEL_EXPORTER_OTLP_ENDPOINT: process.env["OTEL_EXPORTER_OTLP_ENDPOINT"],
  OTEL_EXPORTER_OTLP_HEADERS: process.env["OTEL_EXPORTER_OTLP_HEADERS"],

  NEO_AUTO_SHARE: truthy("NEO_AUTO_SHARE"), // neocode_change
  NEO_AUTO_HEAP_SNAPSHOT: truthy("NEO_AUTO_HEAP_SNAPSHOT"),
  NEO_GIT_BASH_PATH: process.env["NEO_GIT_BASH_PATH"],
  NEO_CONFIG: process.env["NEO_CONFIG"],
  NEO_CONFIG_CONTENT: process.env["NEO_CONFIG_CONTENT"],
  NEO_DISABLE_AUTOUPDATE: truthy("NEO_DISABLE_AUTOUPDATE"),
  NEO_ALWAYS_NOTIFY_UPDATE: truthy("NEO_ALWAYS_NOTIFY_UPDATE"),
  NEO_DISABLE_PRUNE: truthy("NEO_DISABLE_PRUNE"),
  NEO_DISABLE_TERMINAL_TITLE: truthy("NEO_DISABLE_TERMINAL_TITLE"),
  NEO_SHOW_TTFD: truthy("NEO_SHOW_TTFD"),
  // neocode_change start
  NEO_DISABLE_DEFAULT_PLUGINS: truthy("NEO_DISABLE_DEFAULT_PLUGINS"),
  NEO_DISABLE_LSP_DOWNLOAD: truthy("NEO_DISABLE_LSP_DOWNLOAD"),
  NEO_ENABLE_EXPERIMENTAL_MODELS: truthy("NEO_ENABLE_EXPERIMENTAL_MODELS"),
  // neocode_change end
  NEO_DISABLE_AUTOCOMPACT: truthy("NEO_DISABLE_AUTOCOMPACT"),
  NEO_DISABLE_MODELS_FETCH: truthy("NEO_DISABLE_MODELS_FETCH"),
  NEO_DISABLE_MOUSE: truthy("NEO_DISABLE_MOUSE"),
  // neocode_change start
  NEO_DISABLE_CLAUDE_CODE,
  NEO_DISABLE_CLAUDE_CODE_PROMPT: NEO_DISABLE_CLAUDE_CODE || truthy("NEO_DISABLE_CLAUDE_CODE_PROMPT"),
  NEO_DISABLE_CLAUDE_CODE_SKILLS,
  NEO_DISABLE_EXTERNAL_SKILLS: truthy("NEO_DISABLE_EXTERNAL_SKILLS"),
  NEO_EXPERIMENTAL_CUSTOMIZE_SKILL: unstableDefault("NEO_EXPERIMENTAL_CUSTOMIZE_SKILL"),
  // neocode_change end
  NEO_FAKE_VCS: process.env["NEO_FAKE_VCS"],
  NEO_SERVER_PASSWORD: process.env["NEO_SERVER_PASSWORD"],
  NEO_SERVER_USERNAME: process.env["NEO_SERVER_USERNAME"],
  NEO_ENABLE_QUESTION_TOOL: truthy("NEO_ENABLE_QUESTION_TOOL"), // neocode_change

  NEO_EXPERIMENTAL, // neocode_change

  NEO_EXPERIMENTAL_FILEWATCHER: Config.boolean("NEO_EXPERIMENTAL_FILEWATCHER").pipe(Config.withDefault(false)), // neocode_change

  NEO_EXPERIMENTAL_DISABLE_FILEWATCHER: Config.boolean("NEO_EXPERIMENTAL_DISABLE_FILEWATCHER").pipe(
    Config.withDefault(false),
  ),

  NEO_EXPERIMENTAL_ICON_DISCOVERY: NEO_EXPERIMENTAL || truthy("NEO_EXPERIMENTAL_ICON_DISCOVERY"), // neocode_change

  NEO_EXPERIMENTAL_DISABLE_COPY_ON_SELECT:
    copy === undefined ? process.platform === "win32" : truthy("NEO_EXPERIMENTAL_DISABLE_COPY_ON_SELECT"),

  NEO_ENABLE_EXA: truthy("NEO_ENABLE_EXA") || NEO_EXPERIMENTAL || truthy("NEO_EXPERIMENTAL_EXA"), // neocode_change

  NEO_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS: number("NEO_EXPERIMENTAL_BASH_DEFAULT_TIMEOUT_MS"), // neocode_change

  NEO_EXPERIMENTAL_OUTPUT_TOKEN_MAX: number("NEO_EXPERIMENTAL_OUTPUT_TOKEN_MAX"), // neocode_change

  NEO_EXPERIMENTAL_OXFMT: NEO_EXPERIMENTAL || truthy("NEO_EXPERIMENTAL_OXFMT"), // neocode_change

  NEO_EXPERIMENTAL_LSP_TY: truthy("NEO_EXPERIMENTAL_LSP_TY"), // neocode_change

  NEO_EXPERIMENTAL_LSP_TOOL: NEO_EXPERIMENTAL || truthy("NEO_EXPERIMENTAL_LSP_TOOL"), // neocode_change

  NEO_EXPERIMENTAL_PLAN_MODE: NEO_EXPERIMENTAL || truthy("NEO_EXPERIMENTAL_PLAN_MODE"), // neocode_change

  NEO_EXPERIMENTAL_SCOUT: NEO_EXPERIMENTAL || truthy("NEO_EXPERIMENTAL_SCOUT"), // neocode_change

  NEO_EXPERIMENTAL_MARKDOWN: !falsy("NEO_EXPERIMENTAL_MARKDOWN"), // neocode_change

  NEO_ENABLE_PARALLEL: truthy("NEO_ENABLE_PARALLEL") || truthy("NEO_EXPERIMENTAL_PARALLEL"), // neocode_change

  NEO_MODELS_URL: process.env["NEO_MODELS_URL"],

  NEO_MODELS_PATH: process.env["NEO_MODELS_PATH"],

  NEO_DISABLE_EMBEDDED_WEB_UI: truthy("NEO_DISABLE_EMBEDDED_WEB_UI"), // neocode_change

  NEO_DB: process.env["NEO_DB"],

  NEO_DISABLE_CHANNEL_DB: truthy("NEO_DISABLE_CHANNEL_DB"), // neocode_change

  NEO_SKIP_MIGRATIONS: truthy("NEO_SKIP_MIGRATIONS"), // neocode_change

  NEO_STRICT_CONFIG_DEPS: truthy("NEO_STRICT_CONFIG_DEPS"), // neocode_change

  NEO_WORKSPACE_ID: process.env["NEO_WORKSPACE_ID"],

  NEO_EXPERIMENTAL_WORKSPACES: enabledByExperimental("NEO_EXPERIMENTAL_WORKSPACES"),

  NEO_EXPERIMENTAL_EVENT_SYSTEM: NEO_EXPERIMENTAL || truthy("NEO_EXPERIMENTAL_EVENT_SYSTEM"), // neocode_change

  NEO_EXPERIMENTAL_SESSION_SWITCHING: NEO_EXPERIMENTAL || truthy("NEO_EXPERIMENTAL_SESSION_SWITCHING"), // neocode_change

  NEO_EXPERIMENTAL_SESSION_SWITCHER: enabledByExperimental("NEO_EXPERIMENTAL_SESSION_SWITCHER"), // neocode_change

  NEO_DISABLE_FFF: fff === undefined ? process.platform === "win32" : truthy("NEO_DISABLE_FFF"), // neocode_change

  get NEO_DISABLE_PROJECT_CONFIG() {
    return truthy("NEO_DISABLE_PROJECT_CONFIG")
  },
  get NEO_EXPERIMENTAL_REFERENCES() {
    return enabledByExperimental("NEO_EXPERIMENTAL_REFERENCES")
  },
  get NEO_TUI_CONFIG() {
    return process.env["NEO_TUI_CONFIG"]
  },
  get NEO_CONFIG_DIR() {
    return process.env["NEO_CONFIG_DIR"]
  },
  get NEO_PURE() {
    return truthy("NEO_PURE")
  },
  get NEO_PERMISSION() {
    return process.env["NEO_PERMISSION"]
  },
  get NEO_PLUGIN_META_FILE() {
    return process.env["NEO_PLUGIN_META_FILE"]
  },
  get NEO_CLIENT() {
    return process.env["NEO_CLIENT"] ?? "cli"
  },
  // neocode_change start
  get NEO_SESSION_RETRY_LIMIT() {
    return number("NEO_SESSION_RETRY_LIMIT")
  },
  // neocode_change end
}
