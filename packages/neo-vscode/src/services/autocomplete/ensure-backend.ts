import * as vscode from "vscode"
import type { NeoConnectionService } from "../cli-backend"

/**
 * Start the CLI backend if autocomplete is enabled and a workspace folder exists.
 * Idempotent — connectionService.connect() deduplicates concurrent calls.
 */
export function ensureBackendForAutocomplete(connection: NeoConnectionService): void {
  const enabled =
    vscode.workspace.getConfiguration("neo-code.new.autocomplete").get<boolean>("enableAutoTrigger") ?? true
  const dir = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
  if (!enabled || !dir) return
  connection.connect(dir).catch((err) => {
    console.error("[Neo New] Autocomplete: Failed to start CLI backend:", err)
  })
}
