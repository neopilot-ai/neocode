import type { TuiPlugin } from "@neocode/plugin/tui"
import type { InternalTuiPlugin } from "@/plugin/tui/internal"
import { MemoryPermission } from "@/neocode/cli/cmd/tui/permissions"

const id = "internal:neo-permissions"

const tui: TuiPlugin = async () => {
  MemoryPermission.register()
}

const plugin: InternalTuiPlugin = {
  id,
  tui,
}

export default plugin
