import { afterEach, describe, expect, test } from "bun:test"
import path from "path"
import fs from "fs/promises"
import { Flag } from "@opencode-ai/core/flag/flag"
import * as Log from "@opencode-ai/core/util/log"
import { Server } from "../../../src/server/server"
import { resetDatabase } from "../../fixture/db"
import { disposeAllInstances, tmpdir } from "../../fixture/fixture"

void Log.init({ print: false })

type Source = {
  order: number
  kind: string
  scope: string
  label: string
  source: string
  path?: string
  exists: boolean
  editable: boolean
  reason?: string
}

type Body = {
  sources: Source[]
}

const env = {
  NEO_CONFIG: process.env.NEO_CONFIG,
  NEO_CONFIG_CONTENT: process.env.NEO_CONFIG_CONTENT,
  NEO_CONFIG_DIR: process.env.NEO_CONFIG_DIR,
  NEO_DISABLE_PROJECT_CONFIG: process.env.NEO_DISABLE_PROJECT_CONFIG,
  NEO_TEST_MANAGED_CONFIG_DIR: process.env.NEO_TEST_MANAGED_CONFIG_DIR,
  flagConfig: Flag.NEO_CONFIG,
}

afterEach(async () => {
  restore()
  await disposeAllInstances()
  await resetDatabase()
})

function restore() {
  set("NEO_CONFIG", env.NEO_CONFIG)
  set("NEO_CONFIG_CONTENT", env.NEO_CONFIG_CONTENT)
  set("NEO_CONFIG_DIR", env.NEO_CONFIG_DIR)
  set("NEO_DISABLE_PROJECT_CONFIG", env.NEO_DISABLE_PROJECT_CONFIG)
  set("NEO_TEST_MANAGED_CONFIG_DIR", env.NEO_TEST_MANAGED_CONFIG_DIR)
  Flag.NEO_CONFIG = env.flagConfig
}

function set(key: keyof typeof process.env, value: string | undefined) {
  if (value === undefined) {
    delete process.env[key]
    return
  }
  process.env[key] = value
}

async function sources(dir: string) {
  const response = await Server.Default().app.request("/config/sources", {
    headers: { "x-neo-directory": dir },
  })
  expect(response.status).toBe(200)
  return (await response.json()) as Body
}

function order(body: Body, file: string) {
  const hit = body.sources.find((source) => source.path === file)
  expect(hit).toBeDefined()
  return hit!.order
}

describe("config source routes", () => {
  test("lists source metadata in load order without config contents", async () => {
    await using tmp = await tmpdir({
      init: async (dir) => {
        await Bun.write(path.join(dir, "env.json"), "{}")
        await Bun.write(path.join(dir, "neo.json"), "{}")

        for (const root of [".opencode", ".neocode", ".neo"]) {
          const local = path.join(dir, root)
          await fs.mkdir(local, { recursive: true })
          await Bun.write(path.join(local, "neo.jsonc"), "{}")
        }

        const extra = path.join(dir, "extra")
        await fs.mkdir(extra, { recursive: true })
        await Bun.write(path.join(extra, "opencode.json"), "{}")

        const managed = path.join(dir, "managed")
        await fs.mkdir(managed, { recursive: true })
        await Bun.write(path.join(managed, "neo.json"), "{}")
      },
    })

    const envFile = path.join(tmp.path, "env.json")
    const projectFile = path.join(tmp.path, "neo.json")
    const opencodeFile = path.join(tmp.path, ".opencode", "neo.jsonc")
    const neocodeFile = path.join(tmp.path, ".neocode", "neo.jsonc")
    const configFile = path.join(tmp.path, ".neo", "neo.jsonc")
    const extraFile = path.join(tmp.path, "extra", "opencode.json")
    const managedFile = path.join(tmp.path, "managed", "neo.json")

    process.env.NEO_CONFIG = envFile
    Flag.NEO_CONFIG = envFile
    process.env.NEO_CONFIG_CONTENT = '{"username":"secret-inline-value"}'
    process.env.NEO_CONFIG_DIR = path.join(tmp.path, "extra")
    process.env.NEO_TEST_MANAGED_CONFIG_DIR = path.join(tmp.path, "managed")

    const body = await sources(tmp.path)
    const inline = body.sources.find((source) => source.source === "NEO_CONFIG_CONTENT")

    expect(order(body, envFile)).toBeLessThan(order(body, projectFile))
    expect(order(body, projectFile)).toBeLessThan(order(body, neocodeFile))
    expect(order(body, neocodeFile)).toBeLessThan(order(body, configFile))
    expect(body.sources.some((source) => source.path === opencodeFile)).toBe(false)
    expect(order(body, configFile)).toBeLessThan(order(body, extraFile))
    expect(inline?.order).toBeGreaterThan(order(body, extraFile))
    expect(inline?.order).toBeLessThan(order(body, managedFile))

    expect(body.sources.find((source) => source.path === configFile)).toMatchObject({
      kind: "config-dir-file",
      scope: "project",
      exists: true,
      editable: true,
    })
    expect(body.sources.find((source) => source.path === managedFile)).toMatchObject({
      kind: "managed-file",
      scope: "managed",
      exists: true,
      editable: false,
    })
    expect(JSON.stringify(body)).not.toContain("secret-inline-value")
  })

  test("shows project config disabled by environment", async () => {
    await using tmp = await tmpdir({
      init: async (dir) => {
        await Bun.write(path.join(dir, "neo.json"), "{}")
        await fs.mkdir(path.join(dir, ".neo"), { recursive: true })
        await Bun.write(path.join(dir, ".neo", "neo.json"), "{}")
      },
    })

    process.env.NEO_DISABLE_PROJECT_CONFIG = "1"

    const body = await sources(tmp.path)

    expect(body.sources.some((source) => source.path === path.join(tmp.path, "neo.json"))).toBe(false)
    expect(body.sources.some((source) => source.path === path.join(tmp.path, ".neo", "neo.json"))).toBe(false)
    expect(body.sources.find((source) => source.source === "NEO_DISABLE_PROJECT_CONFIG")).toMatchObject({
      kind: "runtime-env",
      scope: "env",
      exists: true,
      editable: false,
    })
  })
})
