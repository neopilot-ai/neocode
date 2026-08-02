import type { NeoClient } from "@neocode/sdk/v2/client"

export async function stopSessionProcesses(
  client: NeoClient | null,
  sessionID: string,
  directory: string,
): Promise<void> {
  if (!client) return
  await client.backgroundProcess
    .stopSession({ sessionID, directory })
    .catch((err: unknown) => console.warn("[Neo New] NeoProvider: Failed to stop background processes:", err))
}
