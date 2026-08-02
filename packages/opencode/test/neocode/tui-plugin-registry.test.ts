import { expect, test } from "bun:test"
import { internalTuiPlugins } from "@/plugin/tui/internal"

const neo = [
  "internal:home-news",
  "internal:home-onboarding",
  "internal:neo-attention",
  "internal:neo-home-footer",
  "internal:neo-permissions",
  "internal:neo-sidebar-footer",
  "internal:neo-sidebar-memory",
  "internal:neo-memory-palette",
  "internal:neo-sidebar-background-processes",
  "internal:neo-sidebar-indexing",
  "internal:neo-sidebar-pr",
  "internal:neo-sidebar-usage",
  "internal:sandbox",
  "internal:remote",
  "internal:reload",
]

test("internal TUI registry preserves every Neo plugin before upstream builtins", () => {
  const ids = internalTuiPlugins({ experimentalEventSystem: false, experimentalSessionSwitcher: false }).map(
    (plugin) => plugin.id,
  )

  expect(ids.slice(0, neo.length)).toEqual(neo)
  expect(new Set(ids).size).toBe(ids.length)
  expect(ids).toContain("internal:sidebar-context")
  expect(ids).toContain("diff-viewer")
})

test("experimental Neo TUI plugins remain wired", () => {
  const ids = internalTuiPlugins({ experimentalEventSystem: true, experimentalSessionSwitcher: true }).map(
    (plugin) => plugin.id,
  )

  expect(ids).toContain("internal:session-v2-debug")
  expect(ids).toContain("internal:session-switcher")
})
