import { describe, expect, test } from "bun:test"
import { NeoTerminalTitle } from "../../src/neocode/cli/cmd/tui/terminal-title"

const base = "Neo CLI"

function data(input: Partial<NeoTerminalTitle.Data> = {}): NeoTerminalTitle.Data {
  return {
    session: [{ id: "parent", title: "Build status" }],
    session_status: {},
    permission: {},
    question: {},
    suggestion: {},
    network: {},
    message: {},
    part: {},
    ...input,
  }
}

describe("NeoTerminalTitle", () => {
  test("format_noneStyle_hidesStatusIcon", () => {
    expect(NeoTerminalTitle.format({ base, title: "Build status", indicator: "working" })).toBe(
      "Neo CLI | Build status",
    )
  })

  test("format_noIndicator_returnsBaseTitle", () => {
    expect(NeoTerminalTitle.format({ base, indicator: "none", icon: "unicode" })).toBe("Neo CLI")
  })

  test("format_unicodeStyle_usesUnicodeIcons", () => {
    expect(NeoTerminalTitle.format({ base, indicator: "working", icon: "unicode" })).toBe("◔ Neo CLI")
    expect(NeoTerminalTitle.format({ base, indicator: "attention", icon: "unicode" })).toBe("⚠ Neo CLI")
    expect(NeoTerminalTitle.format({ base, indicator: "finished", icon: "unicode" })).toBe("✓ Neo CLI")
  })

  test("format_emojiStyle_usesEmojiIcons", () => {
    expect(NeoTerminalTitle.format({ base, indicator: "working", icon: "emojis" })).toBe("💭 Neo CLI")
    expect(NeoTerminalTitle.format({ base, indicator: "attention", icon: "emojis" })).toBe("🔶 Neo CLI")
    expect(NeoTerminalTitle.format({ base, indicator: "finished", icon: "emojis" })).toBe("✅ Neo CLI")
  })

  test("format_longSessionTitle_truncatesToExistingLimit", () => {
    expect(
      NeoTerminalTitle.format({
        base,
        title: "12345678901234567890123456789012345678901234567890",
        indicator: "working",
        icon: "unicode",
      }),
    ).toBe("◔ Neo CLI | 1234567890123456789012345678901234567...")
  })

  test("session_newIdleSession_hasNoIndicator", () => {
    expect(
      NeoTerminalTitle.session({
        base,
        id: "parent",
        data: data(),
        done: {},
      }),
    ).toEqual({ title: "Neo CLI | Build status", id: "parent", active: false, indicator: "none" })
  })

  test("session_busySession_isWorking", () => {
    expect(
      NeoTerminalTitle.session({
        base,
        id: "parent",
        data: data({ session_status: { parent: { type: "busy" } } }),
        done: {},
        icon: "unicode",
      }),
    ).toEqual({ title: "◔ Neo CLI | Build status", id: "parent", active: true, indicator: "working" })
  })

  test("session_pendingPermission_overridesBusy", () => {
    expect(
      NeoTerminalTitle.session({
        base,
        id: "parent",
        data: data({
          session_status: { parent: { type: "busy" } },
          permission: { parent: [{}] },
        }),
        done: {},
      }).indicator,
    ).toBe("attention")
  })

  test("session_childQuestion_marksParentAttention", () => {
    expect(
      NeoTerminalTitle.session({
        base,
        id: "parent",
        data: data({
          session: [
            { id: "parent", title: "Build status" },
            { id: "child", title: "Child", parentID: "parent" },
          ],
          question: { child: [{ blocking: true }] },
        }),
        done: {},
      }).indicator,
    ).toBe("attention")
  })

  test("session_latestAssistantPlanExit_marksAttention", () => {
    expect(
      NeoTerminalTitle.session({
        base,
        id: "parent",
        data: data({
          message: { parent: [{ id: "m1", role: "assistant" }] },
          part: {
            m1: [{ type: "tool", tool: "plan_exit", state: { status: "completed" } }],
          },
        }),
        done: {},
      }).indicator,
    ).toBe("attention")
  })

  test("session_latestUserAfterPlanExit_clearsPlanExitAttention", () => {
    expect(
      NeoTerminalTitle.session({
        base,
        id: "parent",
        data: data({
          message: {
            parent: [
              { id: "m1", role: "assistant" },
              { id: "m2", role: "user" },
            ],
          },
          part: {
            m1: [{ type: "tool", tool: "plan_exit", state: { status: "completed" } }],
          },
        }),
        done: {},
      }).indicator,
    ).toBe("none")
  })

  test("session_doneIdleSession_isFinished", () => {
    expect(
      NeoTerminalTitle.session({
        base,
        id: "parent",
        data: data(),
        done: { parent: true },
      }).indicator,
    ).toBe("finished")
  })
})
