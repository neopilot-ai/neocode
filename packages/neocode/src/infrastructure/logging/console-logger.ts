import type { ILogger } from "@neocode-ai/ports/logger"

export class ConsoleLogger implements ILogger {
  debug(message: string, data?: any) {
    console.debug("[debug]", message, data ?? "")
  }
  info(message: string, data?: any) {
    console.info("[info]", message, data ?? "")
  }
  warn(message: string, data?: any) {
    console.warn("[warn]", message, data ?? "")
  }
  error(message: string, data?: any) {
    console.error("[error]", message, data ?? "")
  }
}
