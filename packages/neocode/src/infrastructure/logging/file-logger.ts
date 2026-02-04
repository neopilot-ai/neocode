import fs from "fs"
import type { ILogger } from "@neocode-ai/ports/logger"

export class FileLogger implements ILogger {
  private stream: fs.WriteStream

  constructor(path: string) {
    this.stream = fs.createWriteStream(path, { flags: "a" })
  }

  private write(level: string, msg: string, meta?: any) {
    const line = JSON.stringify({ ts: Date.now(), level, msg, meta }) + "\n"
    this.stream.write(line)
  }

  debug(msg: string, meta?: any) {
    this.write("debug", msg, meta)
  }
  info(msg: string, meta?: any) {
    this.write("info", msg, meta)
  }
  warn(msg: string, meta?: any) {
    this.write("warn", msg, meta)
  }
  error(msg: string, meta?: any) {
    this.write("error", msg, meta)
  }
}
