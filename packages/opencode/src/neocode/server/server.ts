// neocode_change - new file
// Neo-specific overrides for the server control plane.
// Imported by ../../server/server.ts with minimal neocode_change markers.

/** Additional CORS origin check for *.neo.khulnasoft.com */
export function corsOrigin(input: string): string | undefined {
  if (/^https:\/\/([a-z0-9-]+\.)*neo\.ai$/.test(input)) {
    return input
  }
  return undefined
}

export const DOC_TITLE = "neo"
export const DOC_DESCRIPTION = "neo api"
