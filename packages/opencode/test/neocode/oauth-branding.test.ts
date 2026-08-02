import { describe, expect, test } from "bun:test"
import path from "path"

const root = path.join(__dirname, "..", "..")

describe("Neo OAuth branding", () => {
  test("Codex OAuth browser flow uses Neo branding", async () => {
    const src = await Bun.file(path.join(root, "src", "plugin", "openai", "codex.ts")).text()

    expect(src).toContain('originator: "neo"')
    expect(src).toContain('"User-Agent": `neo/${InstallationVersion}`')
    expect(src).toContain("return to Neo")
    expect(src).not.toContain('originator: "opencode"')
    expect(src).not.toContain("return to OpenCode")
  })

  test("extracted core OAuth browser flow uses Neo branding", async () => {
    const src = await Bun.file(path.join(root, "..", "core", "src", "plugin", "provider", "openai-auth.ts")).text()

    expect(src).toContain('originator: "neo"')
    expect(src).toContain('"User-Agent": `neo/${InstallationVersion}`')
    expect(src).toContain("<title>Neo</title>")
    expect(src).not.toContain('originator: "opencode"')
    expect(src).not.toContain("<title>OpenCode</title>")
  })

  test("MCP OAuth callback page uses Neo branding", async () => {
    const src = await Bun.file(path.join(root, "src", "mcp", "oauth-callback.ts")).text()

    expect(src).toContain("return to Neo")
    expect(src).not.toContain("return to OpenCode")
  })
})
