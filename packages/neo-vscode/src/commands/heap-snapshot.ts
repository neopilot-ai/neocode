import * as vscode from "vscode"
import type { NeoConnectionService } from "../services/cli-backend/connection-service"

export function registerHeapSnapshot(context: vscode.ExtensionContext, connectionService: NeoConnectionService): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("neo-code.new.takeHeapSnapshot", async () => {
      try {
        const file = await snapshot(connectionService)
        vscode.window.showInformationMessage(`Heap snapshot written to ${file}`)
      } catch (err) {
        vscode.window.showErrorMessage(`Failed to write heap snapshot: ${message(err)}`)
      }
    }),
  )
}

async function snapshot(connectionService: NeoConnectionService) {
  await connectionService.getClientAsync()
  const cfg = connectionService.getServerConfig()
  if (!cfg) throw new Error("CLI server is not connected")

  const auth = Buffer.from(`neo:${cfg.password}`).toString("base64")
  const res = await fetch(`${cfg.baseUrl}/neocode/heap/snapshot`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
    },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return (await res.json()) as string
}

function message(err: unknown) {
  if (err instanceof Error) return err.message
  return String(err)
}
