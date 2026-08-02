import { existsSync } from "fs"
import * as os from "os"
import * as path from "path"

export type Scope = "global" | "local"

export type Source =
  | "sourceXdg"
  | "sourceHomeNeo"
  | "sourceHomeNeocode"
  | "sourceHomeOpencode"
  | "sourceEnvFile"
  | "sourceEnvDir"
  | "sourceEnvContent"
  | "sourceProjectNeo"
  | "sourceProjectRoot"
  | "sourceProjectNeocode"
  | "sourceProjectOpencode"

export interface Entry {
  file?: string
  name: string
  source: Source
  exists: boolean
  loaded: boolean
  legacy?: boolean
  recommended?: boolean
  virtual?: boolean
}

const SCHEMA = "https://app.neo.khulnasoft.com/config.json"

const MODERN = ["neo.jsonc", "neo.json"]
const LEGACY = ["opencode.jsonc", "opencode.json"]
const FILES = [...MODERN, ...LEGACY]
const GLOBAL = ["neo.jsonc", "neo.json", "opencode.jsonc", "opencode.json", "config.json"]
const HOME = [".neo", ".neocode", ".opencode"]
const SOURCES: Record<string, Source> = {
  ".neo": "sourceHomeNeo",
  ".neocode": "sourceHomeNeocode",
  ".opencode": "sourceHomeOpencode",
}

function row(file: string, source: Source, loaded = true, recommended = false): Entry {
  const name = path.basename(file)
  return {
    file,
    name,
    source,
    exists: existsSync(file),
    loaded: loaded && existsSync(file),
    legacy: name.startsWith("opencode") || name === "config.json" || file.includes(`${path.sep}.neocode${path.sep}`),
    recommended,
  }
}

function ensure(list: Entry[], file: string, source: Source) {
  if (list.some((item) => item.file === file)) return list
  return [...list, row(file, source, true, true)]
}

export function globalFiles() {
  const root = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config"), "neo")
  const base = GLOBAL.map((file) => row(path.join(root, file), "sourceXdg")).filter((item) => item.exists)
  const dirs = HOME.flatMap((dir) => {
    const base = path.join(os.homedir(), dir)
    if (!existsSync(base)) return []
    return FILES.map((file) => row(path.join(base, file), SOURCES[dir])).filter((item) => item.exists)
  })
  const env = process.env.NEO_CONFIG ? [row(process.env.NEO_CONFIG, "sourceEnvFile")] : []
  const extra = process.env.NEO_CONFIG_DIR
  const dir = extra
    ? ensure(
        FILES.map((file) => row(path.join(extra, file), "sourceEnvDir")).filter((item) => item.exists),
        path.join(extra, "neo.jsonc"),
        "sourceEnvDir",
      )
    : []
  const virtual: Entry[] = process.env.NEO_CONFIG_CONTENT
    ? [
        {
          name: "NEO_CONFIG_CONTENT",
          source: "sourceEnvContent",
          exists: true,
          loaded: true,
          virtual: true,
        },
      ]
    : []

  return ensure([...base, ...dirs, ...env, ...dir, ...virtual], path.join(root, "neo.jsonc"), "sourceXdg")
}

export function localFiles(root: string) {
  const enabled = !process.env.NEO_DISABLE_PROJECT_CONFIG
  const dirs = [path.join(root, ".neo"), root, path.join(root, ".neocode"), path.join(root, ".opencode")]
  const list = dirs.flatMap((dir) => FILES.map((file) => row(path.join(dir, file), localSource(root, dir), enabled)))
  return ensure(
    list.filter((item) => item.exists),
    path.join(root, ".neo", "neo.jsonc"),
    "sourceProjectNeo",
  ).map((item) => (enabled ? item : { ...item, loaded: false }))
}

function localSource(root: string, dir: string) {
  if (dir === root) return "sourceProjectRoot"
  if (dir.endsWith(`${path.sep}.neo`)) return "sourceProjectNeo"
  if (dir.endsWith(`${path.sep}.neocode`)) return "sourceProjectNeocode"
  return "sourceProjectOpencode"
}

export function content() {
  return `{
  "$schema": "${SCHEMA}"
}
`
}
