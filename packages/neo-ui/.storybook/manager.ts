import { addons } from "storybook/manager-api"
import { GLOBALS_UPDATED, SET_GLOBALS } from "storybook/internal/core-events"

addons.register("neo-ui/toolbar-visibility", (api) => {
  const update = (globals: Record<string, unknown>) => {
    const isVscode = globals["theme"] === "neo-vscode"
    document.documentElement.setAttribute("data-neo-theme", isVscode ? "neo-vscode" : "neo")
  }

  const channel = api.getChannel()
  if (!channel) return

  channel.on(SET_GLOBALS, ({ globals }: { globals: Record<string, unknown> }) => {
    update(globals)
  })

  channel.on(GLOBALS_UPDATED, ({ globals }: { globals: Record<string, unknown> }) => {
    update(globals)
  })
})
