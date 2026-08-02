// neocode_change - new file
import { describe, expect, test } from "bun:test"
import { NeoRunAuto } from "../../src/neocode/cli/run-auto"

describe("NeoRunAuto", () => {
  test("tracks task child sessions without allowing unrelated sessions", () => {
    const state = NeoRunAuto.create("ses_root")

    expect(NeoRunAuto.allowed(state, "ses_root")).toBe(true)
    expect(NeoRunAuto.allowed(state, "ses_child")).toBe(false)

    NeoRunAuto.track(state, {
      type: "tool",
      tool: "task",
      sessionID: "ses_root",
      state: {
        metadata: {
          sessionId: "ses_child",
        },
      },
    })

    expect(NeoRunAuto.allowed(state, "ses_child")).toBe(true)
    expect(NeoRunAuto.allowed(state, "ses_other")).toBe(false)
  })

  test("ignores malformed or non-root task metadata", () => {
    const state = NeoRunAuto.create("ses_root")

    NeoRunAuto.track(state, {
      type: "tool",
      tool: "task",
      sessionID: "ses_root",
      state: {
        metadata: {
          sessionId: "",
        },
      },
    })
    NeoRunAuto.track(state, {
      type: "tool",
      tool: "task",
      sessionID: "ses_other",
      state: {
        metadata: {
          sessionId: "ses_wrong",
        },
      },
    })
    NeoRunAuto.track(state, {
      type: "text",
      sessionID: "ses_root",
      state: {},
    })

    expect(NeoRunAuto.allowed(state, "ses_wrong")).toBe(false)
    expect(NeoRunAuto.allowed(state, "")).toBe(false)
  })
})
