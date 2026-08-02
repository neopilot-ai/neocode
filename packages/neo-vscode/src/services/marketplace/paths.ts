import * as path from "path"
import * as os from "os"

/**
 * Global config dir: ~/.config/neo/ (XDG_CONFIG_HOME/neo)
 * This matches where the CLI reads global config from.
 */
function globalConfigDir(): string {
  const xdg = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config")
  return path.join(xdg, "neo")
}

export class MarketplacePaths {
  /** Project-scope config file: <workspace>/.neo/neo.json */
  configPath(scope: "project" | "global", workspace?: string): string {
    if (scope === "project") return path.join(workspace!, ".neo", "neo.json")
    return path.join(globalConfigDir(), "neo.json")
  }

  /** Agent install directory (where marketplace agents are written as .md files). */
  agentsDir(scope: "project" | "global", workspace?: string): string {
    if (scope === "project") return path.join(workspace!, ".neo", "agents")
    return path.join(globalConfigDir(), "agents")
  }

  /** Skill install directory (where the marketplace installer writes to). */
  skillsDir(scope: "project" | "global", workspace?: string): string {
    if (scope === "project") return path.join(workspace!, ".neo", "skills")
    return path.join(os.homedir(), ".neo", "skills")
  }
}
