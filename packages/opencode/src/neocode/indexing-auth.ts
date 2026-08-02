import type { IndexingConfig } from "@neocode/neo-indexing/config"

type Auth = unknown

type Env = {
  NEO_API_KEY?: string
  NEO_ORG_ID?: string
}

type Provider = {
  key?: unknown
  options?: Record<string, unknown>
}

export type NeoIndexingAuth = {
  apiKey?: string
  baseUrl?: string
  organizationId?: string
}

const providers = [
  "openai",
  "ollama",
  "openai-compatible",
  "gemini",
  "mistral",
  "vercel-ai-gateway",
  "bedrock",
  "openrouter",
  "voyage",
]

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function text(value: unknown): string | undefined {
  if (typeof value !== "string") return
  const trimmed = value.trim()
  return trimmed || undefined
}

function token(auth: Auth): string | undefined {
  const data = record(auth)
  if (data.type === "api") return text(data.key)
  if (data.type === "oauth") return text(data.access)
  return
}

function org(auth: Auth): string | undefined {
  const data = record(auth)
  if (data.type === "oauth") return text(data.accountId)
  return
}

function value(input: unknown): boolean {
  if (input === undefined || input === null) return false
  if (typeof input === "string") return input.trim().length > 0
  if (typeof input === "object") return Object.values(input).some(value)
  return true
}

function hasOtherProvider(indexing: unknown): boolean {
  const cfg = record(indexing)
  return providers.some((provider) => value(cfg[provider]))
}

export function resolveNeoIndexingAuth(input: {
  config?: unknown
  provider?: Provider
  auth?: Auth
  env?: Env
}): NeoIndexingAuth {
  const config = record(input.config)
  const options = record(record(config.provider).neo)
  const provider = input.provider ?? record(input.provider)
  const providerOptions = record(provider.options)
  const providerConfig = record(options.options)
  const neo = record(record(config.indexing).neo)
  const env = input.env ?? process.env

  return {
    apiKey:
      text(neo.apiKey) ??
      text(providerConfig.apiKey) ??
      token(input.auth) ??
      text(provider.key) ??
      text(providerOptions.neocodeToken) ??
      text(env.NEO_API_KEY),
    baseUrl: text(neo.baseUrl) ?? text(providerConfig.baseURL) ?? text(providerConfig.baseUrl),
    organizationId:
      text(neo.organizationId) ??
      text(providerConfig.neocodeOrganizationId) ??
      org(input.auth) ??
      text(providerOptions.neocodeOrganizationId) ??
      text(env.NEO_ORG_ID),
  }
}

export function hasNeoIndexingAuth(input: Parameters<typeof resolveNeoIndexingAuth>[0]): boolean {
  return !!resolveNeoIndexingAuth(input).apiKey
}

export function shouldDefaultIndexingToNeo(indexing: unknown, auth: NeoIndexingAuth): boolean {
  const cfg = record(indexing)
  if (cfg.provider !== undefined || !auth.apiKey) return false
  return !hasOtherProvider(cfg)
}

export function indexingWithNeoDefault(
  indexing: IndexingConfig | undefined,
  auth: NeoIndexingAuth,
): IndexingConfig | undefined {
  if (!shouldDefaultIndexingToNeo(indexing, auth)) return indexing
  return { ...indexing, provider: "neo" }
}
