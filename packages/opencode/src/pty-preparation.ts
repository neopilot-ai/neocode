export * as PtyPreparation from "./pty-preparation"

import { Config } from "@/config/config"
import * as InstanceState from "@/effect/instance-state"
import { Plugin } from "@/plugin"
import { Shell } from "@/shell/shell"
import { Pty } from "@opencode-ai/core/pty"
import { NeoPtySelfCommand } from "@/neocode/pty/self-command" // neocode_change - ported from the deleted @/pty module
import { Effect } from "effect"

export const prepareCreate = Effect.fn("PtyPreparation.prepareCreate")(function* (input: Pty.CreateInput) {
  const config = yield* Config.Service
  const plugin = yield* Plugin.Service
  // neocode_change start - resolve Neo self-commands (e.g. bare `neo`) to the real binary + args + project cwd
  const resolved = NeoPtySelfCommand.resolve({
    command: input.command,
    args: input.args ? [...input.args] : undefined,
    cwd: input.cwd,
  })
  const command = resolved.command || Shell.preferred((yield* config.get()).shell)
  const baseArgs = resolved.args ?? []
  const cwd = resolved.cwd || (yield* InstanceState.context).directory
  // neocode_change end
  const args = Shell.login(command) ? [...baseArgs, "-l"] : [...baseArgs]
  const shell = yield* plugin.trigger("shell.env", { cwd }, { env: {} })
  const env = {
    ...process.env,
    ...input.env,
    ...shell.env,
    TERM: "xterm-256color",
    NEO_TERMINAL: "1",
  } as Record<string, string>
  // neocode_change start - ported from the deleted @/pty module.
  // Don't leak the neo server's auth credential into user shells: anything the shell forks (npm
  // post-install, `curl | bash`, compromised tools) would otherwise see the password for free. Users
  // who need `neo run`/`neo tui attach` to auto-connect from a neo-spawned terminal pass --password.
  delete env.NEO_SERVER_PASSWORD
  delete env.NEO_SERVER_USERNAME
  // neocode_change end
  if (process.platform === "win32") {
    env.LC_ALL = "C.UTF-8"
    env.LC_CTYPE = "C.UTF-8"
    env.LANG = "C.UTF-8"
  }
  return { command, args, cwd, title: input.title, env }
})
