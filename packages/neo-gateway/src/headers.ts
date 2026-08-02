import {
  HEADER_ORGANIZATIONID,
  HEADER_TASKID,
  HEADER_PARENT_TASKID,
  HEADER_PROJECTID,
  HEADER_TESTER,
  HEADER_EDITORNAME,
  HEADER_MACHINEID,
  HEADER_FEATURE,
  USER_AGENT_BASE,
  CONTENT_TYPE,
  DEFAULT_EDITOR_NAME,
  ENV_EDITOR_NAME,
  ENV_VERSION,
  TESTER_SUPPRESS_VALUE,
  ENV_FEATURE,
} from "./api/constants.js"

/**
 * Header constants for neocode API requests
 * @deprecated Use HEADER_* constants from constants.ts instead
 */
export const X_NEOCODE_ORGANIZATIONID = HEADER_ORGANIZATIONID
export const X_NEOCODE_TASKID = HEADER_TASKID
export const X_NEOCODE_PARENT_TASKID = HEADER_PARENT_TASKID
export const X_NEOCODE_PROJECTID = HEADER_PROJECTID
export const X_NEOCODE_TESTER = HEADER_TESTER
export const X_NEOCODE_EDITORNAME = HEADER_EDITORNAME
export const X_NEOCODE_MACHINEID = HEADER_MACHINEID
export const X_NEOCODE_FEATURE = HEADER_FEATURE

/**
 * Get feature header value from NEOCODE_FEATURE env var.
 * Returns undefined when not set — the gateway stores NULL (unattributed).
 * Callers must explicitly set the env var to get attribution.
 */
export function getFeatureHeader(): string | undefined {
  return process.env[ENV_FEATURE] || undefined
}

/**
 * Get User-Agent header value.
 * Appends the version from NEOCODE_VERSION when available.
 */
export function getUserAgent(): string {
  const version = process.env[ENV_VERSION]
  return version ? `${USER_AGENT_BASE}/${version}` : USER_AGENT_BASE
}

/**
 * Default headers for neocode requests
 */
export function getDefaultHeaders(): Record<string, string> {
  return {
    "User-Agent": getUserAgent(),
    "Content-Type": CONTENT_TYPE,
  }
}

/**
 * Get editor name header value
 * When NEOCODE_EDITOR_NAME is set explicitly, use it verbatim (the caller is
 * responsible for including the version, e.g. "Visual Studio Code 1.114.0").
 * Otherwise defaults to "Neo CLI" and appends NEOCODE_VERSION when available.
 */
export function getEditorNameHeader(): string {
  const custom = process.env[ENV_EDITOR_NAME]
  if (custom) return custom
  const version = process.env[ENV_VERSION]
  return version ? `${DEFAULT_EDITOR_NAME} ${version}` : DEFAULT_EDITOR_NAME
}

/**
 * Build neocode-specific headers from metadata and options
 */
export function buildNeoHeaders(
  metadata?: { taskId?: string; projectId?: string },
  options?: {
    neocodeOrganizationId?: string
    neocodeTesterWarningsDisabledUntil?: number
    machineId?: string
  },
): Record<string, string> {
  const feature = getFeatureHeader()
  const headers: Record<string, string> = {
    [X_NEOCODE_EDITORNAME]: getEditorNameHeader(),
    ...(feature ? { [X_NEOCODE_FEATURE]: feature } : {}),
  }

  if (metadata?.taskId) {
    headers[X_NEOCODE_TASKID] = metadata.taskId
  }

  if (options?.neocodeOrganizationId) {
    headers[X_NEOCODE_ORGANIZATIONID] = options.neocodeOrganizationId

    if (metadata?.projectId) {
      headers[X_NEOCODE_PROJECTID] = metadata.projectId
    }
  }

  // Add X-NEOCODE-TESTER: SUPPRESS header if the setting is enabled
  if (options?.neocodeTesterWarningsDisabledUntil && options.neocodeTesterWarningsDisabledUntil > Date.now()) {
    headers[X_NEOCODE_TESTER] = TESTER_SUPPRESS_VALUE
  }

  if (options?.machineId) {
    headers[X_NEOCODE_MACHINEID] = options.machineId
  }

  return headers
}
