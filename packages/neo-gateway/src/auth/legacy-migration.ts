/**
 * Legacy Neo CLI migration module
 *
 * Migrates authentication from the legacy Neo Code VS Code extension CLI
 * config path (~/.neocode/cli/config.json) to the new auth.json format.
 */
import fs from "fs/promises"
import os from "os"
import path from "path"

export const LEGACY_CONFIG_PATH = path.join(os.homedir(), ".neocode", "cli", "config.json")

interface LegacyProvider {
  id: string
  provider: string
  neocodeToken?: string
  neocodeModel?: string
  neocodeOrganizationId?: string
}

interface LegacyConfig {
  providers?: LegacyProvider[]
}

interface LegacyNeoAuth {
  token: string
  organizationId?: string
}

// Auth info types matching opencode's Auth module
type ApiAuth = { type: "api"; key: string }
type OAuthAuth = { type: "oauth"; access: string; refresh: string; expires: number; accountId?: string }
type AuthInfo = ApiAuth | OAuthAuth

/**
 * Extract neo auth from legacy config
 */
function extractNeoAuth(config: LegacyConfig): LegacyNeoAuth | undefined {
  if (!config.providers) return undefined

  const provider = config.providers.find((p) => p.provider === "neocode")
  if (!provider?.neocodeToken) return undefined

  return {
    token: provider.neocodeToken,
    organizationId: provider.neocodeOrganizationId,
  }
}

/**
 * Migrate Neo authentication from legacy CLI config path.
 *
 * Checks ~/.neocode/cli/config.json for existing neo credentials
 * and migrates them to the new auth.json format.
 *
 * @param hasNeoAuth - Callback to check if neo auth already exists
 * @param saveNeoAuth - Callback to save the migrated auth
 * @returns true if migration was performed, false otherwise
 */
export async function migrateLegacyNeoAuth(
  hasNeoAuth: () => Promise<boolean>,
  saveNeoAuth: (auth: AuthInfo) => Promise<void>,
): Promise<boolean> {
  // Skip if neo auth already configured
  if (await hasNeoAuth()) return false

  // Check if legacy config exists and parse it
  const content = await fs.readFile(LEGACY_CONFIG_PATH, "utf-8").catch(() => null)
  if (!content) return false

  let config: LegacyConfig | null = null
  try {
    config = JSON.parse(content) as LegacyConfig
  } catch {
    return false
  }

  // Extract neo auth from legacy config
  const legacy = extractNeoAuth(config)
  if (!legacy) return false

  // Migrate to new format
  // Use OAuth format if organization ID present, otherwise API format
  if (legacy.organizationId) {
    await saveNeoAuth({
      type: "oauth",
      access: legacy.token,
      refresh: "",
      expires: 0,
      accountId: legacy.organizationId,
    })
  } else {
    await saveNeoAuth({
      type: "api",
      key: legacy.token,
    })
  }

  return true
}
