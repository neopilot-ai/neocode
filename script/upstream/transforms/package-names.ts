#!/usr/bin/env bun
/**
 * Transform package names and branding from opencode to neo
 *
 * This script transforms:
 * - opencode-ai -> @neocode/cli
 * - @opencode-ai/cli -> @neocode/cli
 * - @opencode-ai/sdk -> @neocode/sdk
 * - @opencode-ai/plugin -> @neocode/plugin
 * - OPENCODE_* -> NEO_* (env variables, excluding OPENCODE_API_KEY)
 * - x-opencode-* -> x-neo-* (HTTP headers)
 * - opencode.db -> neo.db (database filename)
 * - window.__OPENCODE__ -> window.__NEO__ (window global)
 */

import { Glob } from "bun"
import { info, success } from "../utils/logger"
import { defaultConfig } from "../utils/config"

export interface TransformResult {
  file: string
  changes: number
  dryRun: boolean
}

export interface TransformOptions {
  dryRun?: boolean
  verbose?: boolean
}

const PACKAGE_PATTERNS = [
  // In package.json name field
  { pattern: /"name":\s*"opencode-ai"/, replacement: '"name": "@neocode/cli"' },
  { pattern: /"name":\s*"@opencode-ai\/cli"/, replacement: '"name": "@neocode/cli"' },

  // In dependencies/devDependencies
  { pattern: /"opencode-ai":\s*"/g, replacement: '"@neocode/cli": "' },
  { pattern: /"@opencode-ai\/cli":\s*"/g, replacement: '"@neocode/cli": "' },
  { pattern: /"@opencode-ai\/sdk":\s*"/g, replacement: '"@neocode/sdk": "' },
  { pattern: /"@opencode-ai\/plugin":\s*"/g, replacement: '"@neocode/plugin": "' },

  // In any string context (mock.module, dynamic references, etc.)
  // Only cli, sdk, and plugin are renamed — other @opencode-ai/* packages
  // (e.g. @opencode-ai/ui, @opencode-ai/util) keep their upstream names.
  { pattern: /@opencode-ai\/cli(?=\/|"|'|`|$)/g, replacement: "@neocode/cli" },
  { pattern: /@opencode-ai\/sdk(?=\/|"|'|`|$)/g, replacement: "@neocode/sdk" },
  { pattern: /@opencode-ai\/plugin(?=\/|"|'|`|$)/g, replacement: "@neocode/plugin" },

  // In import statements (supports subpaths like @opencode-ai/sdk/v2)
  { pattern: /from\s+["']opencode-ai["']/g, replacement: 'from "@neocode/cli"' },
  { pattern: /from\s+["']@opencode-ai\/cli(\/[^"']*)?["']/g, replacement: 'from "@neocode/cli$1"' },
  { pattern: /from\s+["']@opencode-ai\/sdk(\/[^"']*)?["']/g, replacement: 'from "@neocode/sdk$1"' },
  { pattern: /from\s+["']@opencode-ai\/plugin(\/[^"']*)?["']/g, replacement: 'from "@neocode/plugin$1"' },

  // In require statements (supports subpaths like @opencode-ai/sdk/v2)
  { pattern: /require\(["']opencode-ai["']\)/g, replacement: 'require("@neocode/cli")' },
  { pattern: /require\(["']@opencode-ai\/cli(\/[^"']*)?["']\)/g, replacement: 'require("@neocode/cli$1")' },
  { pattern: /require\(["']@opencode-ai\/sdk(\/[^"']*)?["']\)/g, replacement: 'require("@neocode/sdk$1")' },
  { pattern: /require\(["']@opencode-ai\/plugin(\/[^"']*)?["']\)/g, replacement: 'require("@neocode/plugin$1")' },

  // Internal placeholder hostname used for in-process RPC (never resolved by DNS)
  { pattern: /opencode\.internal/g, replacement: "neo.internal" },

  // In npx/npm commands
  { pattern: /npx opencode-ai/g, replacement: "npx @neocode/cli" },
  { pattern: /npm install opencode-ai/g, replacement: "npm install @neocode/cli" },
  { pattern: /bun add opencode-ai/g, replacement: "bun add @neocode/cli" },

  // SDK public API renames (Opencode → Neo)
  // Order matters: longer names first to avoid partial matches
  { pattern: /OpencodeClientConfig/g, replacement: "NeoClientConfig" },
  { pattern: /createOpencodeClient/g, replacement: "createNeoClient" },
  { pattern: /createOpencodeServer/g, replacement: "createNeoServer" },
  { pattern: /createOpencodeTui/g, replacement: "createNeoTui" },
  { pattern: /OpencodeClient/g, replacement: "NeoClient" },
  // createOpencode (without suffix) needs negative lookahead to avoid matching createOpencodeClient
  { pattern: /\bcreateOpencode\b(?!Client|Server|Tui)/g, replacement: "createNeo" },

  // Branding: environment variables (exclude OPENCODE_API_KEY — upstream Zen SaaS key)
  { pattern: /\bOPENCODE_(?!API_KEY\b)([A-Z_]+)\b/g, replacement: "NEO_$1" },
  { pattern: /VITE_OPENCODE_/g, replacement: "VITE_NEO_" },
  { pattern: /_EXTENSION_OPENCODE_/g, replacement: "_EXTENSION_NEO_" },

  // Branding: HTTP header prefix
  { pattern: /x-opencode-/g, replacement: "x-neo-" },

  // Branding: window global
  { pattern: /window\.__OPENCODE__/g, replacement: "window.__NEO__" },

  // Branding: database filename
  { pattern: /opencode\.db/g, replacement: "neo.db" },
]

/**
 * Apply package name and branding transforms to content.
 */
export function applyPackageNameTransforms(input: string): { result: string; changes: number } {
  return PACKAGE_PATTERNS.reduce(
    (state, { pattern, replacement }) => {
      const regex = typeof pattern === "string" ? new RegExp(pattern, "g") : pattern
      regex.lastIndex = 0
      const count = (state.result.match(regex) || []).length
      regex.lastIndex = 0
      const result = state.result.replace(regex, replacement)
      if (result === state.result) return state
      return { result, changes: state.changes + count }
    },
    { result: input, changes: 0 },
  )
}

/**
 * Transform package names in a single file
 */
export async function transformFile(filePath: string, options: TransformOptions = {}): Promise<TransformResult> {
  const file = Bun.file(filePath)
  const input = await file.text()
  const { result, changes } = applyPackageNameTransforms(input)

  if (changes > 0 && !options.dryRun) {
    await Bun.write(filePath, result)
  }

  return {
    file: filePath,
    changes,
    dryRun: options.dryRun ?? false,
  }
}

/**
 * Transform package names in all relevant files
 */
export async function transformAll(options: TransformOptions = {}): Promise<TransformResult[]> {
  const results: TransformResult[] = []

  // Find all relevant files
  const patterns = ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.json", "**/*.md"]

  const excludes = defaultConfig.excludePatterns

  for (const pattern of patterns) {
    const glob = new Glob(pattern)

    for await (const path of glob.scan({ absolute: true })) {
      // Skip excluded paths
      if (excludes.some((ex) => path.includes(ex.replace(/\*\*/g, "")))) {
        continue
      }

      const result = await transformFile(path, options)

      if (result.changes > 0) {
        results.push(result)

        if (options.dryRun) {
          info(`[DRY-RUN] Would transform ${result.file}: ${result.changes} changes`)
        } else {
          success(`Transformed ${result.file}: ${result.changes} changes`)
        }
      }
    }
  }

  return results
}

// CLI entry point
if (import.meta.main) {
  const args = process.argv.slice(2)
  const dryRun = args.includes("--dry-run")
  const verbose = args.includes("--verbose")

  if (dryRun) {
    info("Running in dry-run mode (no files will be modified)")
  }

  const results = await transformAll({ dryRun, verbose })

  console.log()
  success(`Transformed ${results.length} files`)

  if (dryRun) {
    info("Run without --dry-run to apply changes")
  }
}
