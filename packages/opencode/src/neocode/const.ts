import { InstallationVersion } from "@opencode-ai/core/installation/version"

export const DEFAULT_HEADERS = {
  "HTTP-Referer": "https://neocode.ai",
  "X-Title": "Neo Code",
  "User-Agent": `Neo-Code/${InstallationVersion}`,
}
