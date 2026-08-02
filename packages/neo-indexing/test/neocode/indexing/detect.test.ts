import { describe, expect, test } from "bun:test"
import { mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { fileURLToPath } from "node:url"
import { hasIndexingPlugin, isIndexingPlugin, normalizePluginName } from "../../../src/detect"

describe("indexing plugin detection", () => {
  test("bundles detect module for browser targets", async () => {
    const dir = await mkdtemp(`${tmpdir()}/neo-indexing-detect-`)
    const result = await Bun.build({
      entrypoints: [fileURLToPath(new URL("../../../src/detect.ts", import.meta.url))],
      minify: true,
      outdir: dir,
      target: "browser",
    })

    expect(result.success).toBe(true)
  })

  test("normalizes supported plugin forms", () => {
    expect(normalizePluginName("neo-indexing")).toBe("neo-indexing")
    expect(normalizePluginName("neo-indexing@1.2.3")).toBe("neo-indexing")
    expect(normalizePluginName("@neocode/neo-indexing")).toBe("@neocode/neo-indexing")
    expect(normalizePluginName("@neocode/neo-indexing@1.2.3")).toBe("@neocode/neo-indexing")
    expect(normalizePluginName("../../packages/neo-indexing")).toBe("@neocode/neo-indexing")
    expect(normalizePluginName("file:///tmp/.opencode/plugin/neo-indexing.js")).toBe("neo-indexing")
    expect(normalizePluginName("file:///tmp/node_modules/@neocode/neo-indexing/index.js")).toBe(
      "@neocode/neo-indexing",
    )
    expect(normalizePluginName("file:///tmp/repo/packages/neo-indexing/src/index.ts")).toBe("@neocode/neo-indexing")
  })

  test("detects supported indexing plugin specifiers", () => {
    const values = [
      "neo-indexing",
      "neo-indexing@1.2.3",
      "@neocode/neo-indexing",
      "@neocode/neo-indexing@1.2.3",
      "../../packages/neo-indexing",
      "file:///tmp/.opencode/plugin/neo-indexing.js",
      "file:///tmp/node_modules/@neocode/neo-indexing/index.js",
      "file:///tmp/repo/packages/neo-indexing/src/index.ts",
    ]

    for (const value of values) {
      expect(isIndexingPlugin(value)).toBe(true)
    }
  })

  test("ignores unrelated plugin specifiers", () => {
    expect(isIndexingPlugin("@neocode/neo-gateway")).toBe(false)
    expect(isIndexingPlugin("file:///tmp/.opencode/plugin/index.js")).toBe(false)
    expect(hasIndexingPlugin(["@neocode/neo-gateway", "foo@1.0.0"])).toBe(false)
  })

  test("detects indexing plugin in merged plugin lists", () => {
    expect(
      hasIndexingPlugin(["@neocode/neo-gateway", "file:///tmp/node_modules/@neocode/neo-indexing/index.js"]),
    ).toBe(true)
  })
})
