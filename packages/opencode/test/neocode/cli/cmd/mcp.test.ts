import { describe, expect, test } from "bun:test"
import { NeocodeMcpConfig } from "@/neocode/cli/cmd/mcp"

const added = `{
  "permission": {
    "bash": "allow"
  },
  "mcp": {
    "linear": {
      "type": "remote",
      "url": "https://mcp.linear.app/mcp",
      "oauth": {}
    }
  },
}`

describe("NeocodeMcpConfig.format", () => {
  test("writes strict JSON for neo.json", () => {
    const output = NeocodeMcpConfig.format("/tmp/neo.json", added)

    expect(JSON.parse(output)).toEqual({
      permission: { bash: "allow" },
      mcp: {
        linear: {
          type: "remote",
          url: "https://mcp.linear.app/mcp",
          oauth: {},
        },
      },
    })
    expect(output).not.toEndWith(",\n}")
  })

  test("preserves JSONC formatting for neo.jsonc", () => {
    expect(NeocodeMcpConfig.format("/tmp/neo.jsonc", added)).toBe(added)
  })
})
