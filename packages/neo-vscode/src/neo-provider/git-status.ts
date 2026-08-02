import type { NeoClient } from "@neocode/sdk/v2/client"

export async function hasGit(client: NeoClient, directory: string): Promise<boolean> {
  return client.project
    .current({ directory })
    .then((r) => r.data?.vcs === "git")
    .catch(() => false)
}
