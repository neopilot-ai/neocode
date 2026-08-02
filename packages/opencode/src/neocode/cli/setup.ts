import type { Argv } from "yargs"
import * as Log from "@opencode-ai/core/util/log"
import { Global } from "@opencode-ai/core/global"
import { InstallationBuildKind, InstallationVersion } from "@opencode-ai/core/installation/version"
import { Telemetry } from "@neocode/neo-telemetry"
import { migrateLegacyNeoAuth, ENV_FEATURE, ENV_VERSION } from "@neocode/neo-gateway"
import { AppRuntime } from "@/effect/app-runtime"
import { Config } from "@/config/config"
import { Auth } from "@/auth"
import { InstanceRuntime } from "@/project/instance-runtime"
import { SessionExport } from "@/neocode/session-export"
import { NeoShutdown } from "@/neocode/cli/shutdown"
import { createHelpCommand } from "@/neocode/help-command"
import { NeoConsoleCommand } from "@/neocode/cli/cmd/console"
import { RollCallCommand } from "@/neocode/cli/cmd/roll-call"
import { ProfileCommand } from "@/neocode/cli/cmd/profile"
import { DaemonCommand } from "@/neocode/cli/cmd/daemon"
import { DevSetupCommand, DevAliasCommand } from "@/neocode/cli/dev-setup"
import { RemoteCommand } from "@/cli/cmd/remote"
import { ConfigCommand as ConfigCLICommand } from "@/cli/cmd/config"
import { JsonMigration } from "@/neocode/storage/json-migration"
import { NeoLog } from "@/neocode/log"

const log = Log.create({ service: "neocode.cli" })

// All Neo-specific CLI customization lives here so the shared upstream entrypoint
// (src/index.ts) only needs a handful of thin call-sites behind neocode_change markers.
// This keeps index.ts close to upstream and reduces merge conflicts on every sync.
export namespace NeoCli {
  // Register only the Neo-specific commands. Upstream commands stay in index.ts's chain so
  // upstream merges that add or remove commands keep working without touching this file.
  export function register<T>(cli: Argv<T>): Argv<T> {
    cli
      .command(NeoConsoleCommand)
      .command(RollCallCommand)
      .command(ProfileCommand)
      .command(RemoteCommand)
      .command(DaemonCommand)
      .command(ConfigCLICommand)
    if (InstallationBuildKind !== "release") cli.command(DevSetupCommand).command(DevAliasCommand)
    // Safe self-reference: `cli` is a typed parameter and yargs `.command()` returns the same
    // instance, so the help command can resolve the fully-built root at handler time. This also
    // sidesteps the self-referential type error the old inline registration hit in index.ts.
    cli.command(createHelpCommand(() => cli))
    return cli
  }

  export async function runner() {
    if (!process.argv.includes("__background-process-runner")) return false
    return (await import("@/neocode/background-process/runner")).BackgroundProcessRunner.maybe()
  }

  // Runs from the upstream `.middleware`, before any command handler. Env tagging is additive so
  // it never has to modify upstream's own env assignments.
  export async function bootstrap(): Promise<void> {
    await NeoLog.init()
    if (!process.env[ENV_FEATURE]) process.env[ENV_FEATURE] = process.argv.includes("serve") ? "unknown" : "cli"
    if (!process.env[ENV_VERSION]) process.env[ENV_VERSION] = InstallationVersion
    process.env.NEO = "1"

    // Must run before AppRuntime initializes the SQLite database, or the marker
    // exists before legacy JSON can be imported.
    await JsonMigration.bootstrap()

    const cfg = await AppRuntime.runPromise(Config.Service.use((c) => c.getGlobal()))
    await Telemetry.init({
      dataPath: Global.Path.data,
      version: InstallationVersion,
      enabled: cfg.experimental?.openTelemetry !== false,
    })

    // Migrate legacy Neo CLI auth (~/.neocode/cli/config.json) into auth.json if present.
    await migrateLegacyNeoAuth(
      async () => (await AppRuntime.runPromise(Auth.Service.use((s) => s.get("neo")))) !== undefined,
      async (auth) => AppRuntime.runPromise(Auth.Service.use((s) => s.set("neo", auth))),
    )

    const auth = await AppRuntime.runPromise(Auth.Service.use((s) => s.get("neo")))
    if (auth) {
      const token = auth.type === "oauth" ? auth.access : auth.key
      const account = auth.type === "oauth" ? auth.accountId : undefined
      await Telemetry.updateIdentity(token, account)
    }

    Telemetry.trackCliStart()
  }

  // Runs from the `finally` block on every exit path.
  export async function shutdown(): Promise<void> {
    const code = typeof process.exitCode === "number" ? process.exitCode : undefined
    Telemetry.trackCliExit(code)
    try {
      await SessionExport.shutdown()
      // Bound telemetry shutdown so an unreachable endpoint (offline, firewall,
      // DNS adblock resolving the host to 0.0.0.0) cannot block process exit on
      // short-lived commands like `neo --help` / `neo --version` (#9788).
      try {
        await Telemetry.shutdown(2000)
      } catch (err) {
        log.warn("telemetry shutdown failed", { err })
      }
    } finally {
      await NeoShutdown.run()
      await InstanceRuntime.disposeAllInstances() // safety net (no-op if already disposed)
    }
  }
}
