import { createBuiltinPlugins, type BuiltinTuiPlugin } from "@opencode-ai/tui/builtins"
import type { RuntimeFlags } from "@/effect/runtime-flags"
import { withNeoTuiPlugins } from "@/neocode/plugins/internal" // neocode_change

export type InternalTuiPlugin = BuiltinTuiPlugin

// neocode_change start
export function internalTuiPlugins(
  flags: Pick<RuntimeFlags.Info, "experimentalEventSystem" | "experimentalSessionSwitcher">,
): InternalTuiPlugin[] {
  return withNeoTuiPlugins(
    createBuiltinPlugins({
      experimentalEventSystem: flags.experimentalEventSystem,
    }),
    flags,
  )
  // neocode_change end
}
