import type { DesktopTheme } from "@opencode-ai/ui/theme/types"
import { DEFAULT_THEMES as UPSTREAM_THEMES } from "@opencode-ai/ui/theme/default-themes"
import neoJson from "./themes/neo.json"
import neoVscodeJson from "./themes/neo-vscode.json"

// Re-export all upstream theme constants
export {
  oc2Theme,
  tokyonightTheme,
  draculaTheme,
  monokaiTheme,
  solarizedTheme,
  nordTheme,
  catppuccinTheme,
  ayuTheme,
  oneDarkProTheme,
  shadesOfPurpleTheme,
  nightowlTheme,
  vesperTheme,
  carbonfoxTheme,
  gruvboxTheme,
  auraTheme,
} from "@opencode-ai/ui/theme/default-themes"

export const neoTheme = neoJson as DesktopTheme
export const neoVscodeTheme = neoVscodeJson as DesktopTheme

export const NEO_THEMES: Record<string, DesktopTheme> = {
  neo: neoTheme,
  "neo-vscode": neoVscodeTheme,
}

// Override DEFAULT_THEMES: Neo themes first, then upstream
export const DEFAULT_THEMES: Record<string, DesktopTheme> = {
  ...NEO_THEMES,
  ...UPSTREAM_THEMES,
}
