// ============================================================================
// Plugin
// ============================================================================
export { NeoAuthPlugin, default } from "./plugin.js"

// ============================================================================
// Provider
// ============================================================================
export { createNeo } from "./provider.js"
export { createNeoDebug } from "./provider-debug.js"
export { neoCustomLoader } from "./loader.js"
export { buildNeoHeaders, getEditorNameHeader, getFeatureHeader, getDefaultHeaders, getUserAgent } from "./headers.js"

// ============================================================================
// Auth
// ============================================================================
export { authenticateWithDeviceAuth } from "./auth/device-auth.js"
export { authenticateWithDeviceAuthTUI } from "./auth/device-auth-tui.js"
export { getNeoUrlFromToken, isValidNeocodeToken, getApiKey } from "./auth/token.js"
export { poll, formatTimeRemaining } from "./auth/polling.js"
export { migrateLegacyNeoAuth, LEGACY_CONFIG_PATH } from "./auth/legacy-migration.js"

// ============================================================================
// API
// ============================================================================
export {
  fetchProfile,
  fetchBalance,
  fetchProfileWithBalance,
  fetchDefaultModel,
  getNeoProfile,
  defaultOrganizationId,
  getNeoBalance,
  getNeoDefaultModel,
  promptOrganizationSelection,
} from "./api/profile.js"
export { fetchNeoPassState } from "./api/neo-pass.js"
export {
  fetchNeoModels,
  type NeoModelsResult,
  fetchNeoImageModels,
  type NeoImageModel,
  type NeoImageModelsResult,
} from "./api/models.js"
export {
  EMPTY_NEO_EMBEDDING_MODEL_CATALOG,
  fetchNeoEmbeddingModelCatalog,
  type NeoEmbeddingModel,
  type NeoEmbeddingModelCatalog,
  type NeoEmbeddingModelCatalogIssue,
} from "./api/embedding-models.js"
export { resolveNeoGatewayBaseUrl, resolveNeoOpenRouterBaseUrl } from "./api/url.js"
export {
  AUTOCOMPLETE_MODELS,
  DEFAULT_AUTOCOMPLETE_MODEL,
  getAutocompleteModel,
  getAutocompleteModelById,
  validAutocompleteModel,
  validAutocompleteProvider,
  type AutocompleteModelDef,
  type AutocompleteProviderID,
} from "./autocomplete.js"
export {
  fetchOrganizationModes,
  clearModesCache,
  type OrganizationMode,
  type OrganizationModeConfig,
} from "./api/modes.js"
export { fetchNeocodeNotifications, type NeocodeNotification } from "./api/notifications.js"
export {
  fetchCloudSession,
  fetchCloudSessionForImport,
  SessionImportValidationError,
  prepareSessionImport,
  importSessionToDb,
} from "./cloud-sessions.js"

// ============================================================================
// Server Routes (optional - requires hono and OpenCode dependencies)
// ============================================================================
export { createNeoRoutes } from "./server/routes.js"
export {
  GatewayError,
  UnauthorizedError,
  getOrganizationId,
  getClawChatCredentials,
  getClawStatus,
  getCloudSessions,
  getNotifications,
  getProfile,
  getToken,
  normalizeClawStatus,
  setOrganization,
} from "./server/handlers.js"

// ============================================================================
// Note: TUI exports moved to separate entry point
// ============================================================================
// For TUI components and commands, import from "@neocode/neo-gateway/tui"
// This avoids circular dependencies with opencode TUI infrastructure

// ============================================================================
// Types
// ============================================================================
export type {
  // Auth types
  DeviceAuthInitiateResponse,
  DeviceAuthPollResponse,
  Organization,
  NeocodeProfile,
  NeocodeBalance,
  NeoPassState,
  PollOptions,
  PollResult,
  // Provider types
  NeoProvider,
  NeoProviderOptions,
  NeoMetadata,
  CustomLoaderResult,
  ProviderInfo,
  LanguageModelV3,
} from "./types.js"

// ============================================================================
// Constants
// ============================================================================
export {
  ENV_NEO_API_URL,
  DEFAULT_NEO_API_URL,
  NEO_API_BASE,
  NEO_CHAT_URL,
  NEO_EVENT_SERVICE_URL,
  NEO_OPENROUTER_BASE,
  POLL_INTERVAL_MS,
  DEFAULT_MODEL,
  DEFAULT_FREE_MODEL,
  TOKEN_EXPIRATION_MS,
  USER_AGENT_BASE,
  CONTENT_TYPE,
  DEFAULT_PROVIDER_NAME,
  ANONYMOUS_API_KEY,
  MODELS_FETCH_TIMEOUT_MS,
  HEADER_ORGANIZATIONID,
  HEADER_TASKID,
  HEADER_PARENT_TASKID,
  HEADER_PROJECTID,
  HEADER_TESTER,
  HEADER_EDITORNAME,
  HEADER_MACHINEID,
  HEADER_FEATURE,
  DEFAULT_EDITOR_NAME,
  ENV_EDITOR_NAME,
  ENV_VERSION,
  TESTER_SUPPRESS_VALUE,
  ENV_FEATURE,
  PROMPTS,
  AI_SDK_PROVIDERS,
} from "./api/constants.js"
