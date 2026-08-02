import type { BuiltinTuiPlugin } from "@opencode-ai/tui/builtins"
import HomeNews from "@/neocode/plugins/home-news"
import HomeOnboarding from "@/neocode/plugins/home-onboarding"
import Attention from "@/neocode/plugins/attention"
import HomeFooter from "@/neocode/plugins/home-footer"
import Permissions from "@/neocode/plugins/permissions"
import SidebarFooter from "@/neocode/plugins/sidebar-footer"
import MemoryStatus from "@/neocode/plugins/memory-status"
import MemoryPalette from "@/neocode/plugins/memory-palette"
import SidebarProcesses from "@/neocode/plugins/sidebar-background-processes"
import SidebarIndexing from "@/neocode/plugins/sidebar-indexing"
import SidebarPr from "@/neocode/plugins/sidebar-pr"
import SidebarUsage from "@/neocode/plugins/sidebar-usage"
import Sandbox from "@/neocode/plugins/sandbox"
import Remote from "@/neocode/plugins/remote"
import Reload from "@/neocode/plugins/reload"
import SessionSwitcher from "@/neocode/plugins/session-switcher"
import SessionV2Debug from "@/neocode/plugins/session-v2-debug"
import type { RuntimeFlags } from "@/effect/runtime-flags"

const plugins = [
  HomeNews,
  HomeOnboarding,
  Attention,
  HomeFooter,
  Permissions,
  SidebarFooter,
  MemoryStatus,
  MemoryPalette,
  SidebarProcesses,
  SidebarIndexing,
  SidebarPr,
  SidebarUsage,
  Sandbox,
  Remote,
  Reload,
] satisfies BuiltinTuiPlugin[]

export function withNeoTuiPlugins(
  builtins: BuiltinTuiPlugin[],
  flags: Pick<RuntimeFlags.Info, "experimentalEventSystem" | "experimentalSessionSwitcher">,
) {
  return [
    ...plugins,
    ...(flags.experimentalEventSystem ? [SessionV2Debug] : []),
    ...(flags.experimentalSessionSwitcher ? [SessionSwitcher] : []),
    ...builtins,
  ]
}
