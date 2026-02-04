/**
 * Port interfaces for logging
 */

export type LogLevel = "debug" | "info" | "warn" | "error"

export interface ILogger {
  debug(message: string, metadata?: Record<string, unknown>): void
  info(message: string, metadata?: Record<string, unknown>): void
  warn(message: string, metadata?: Record<string, unknown>): void
  error(message: string, error?: Error, metadata?: Record<string, unknown>): void
}
