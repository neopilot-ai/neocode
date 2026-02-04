import type { Container } from "@neocode-ai/application"

/**
 * CLI Command Handler base class.
 * All CLI commands should extend this to get consistent error handling
 * and dependency access through the container.
 *
 * Pattern:
 * 1. Extend CommandHandler
 * 2. Implement execute() with command logic
 * 3. Use this.container to access use cases
 * 4. Return Result<T, Error> for consistent error handling
 */
export abstract class CommandHandler {
  constructor(protected container: Container) {}

  /**
   * Execute the command with given arguments.
   * Return Result for type-safe error handling at CLI layer.
   */
  abstract execute(...args: any[]): Promise<void>

  /**
   * Print error to stderr with proper formatting
   */
  protected printError(error: Error | string): void {
    const message = typeof error === "string" ? error : error.message
    console.error(`❌ Error: ${message}`)
  }

  /**
   * Print success message to stdout
   */
  protected printSuccess(message: string): void {
    console.log(`✅ ${message}`)
  }

  /**
   * Print info message to stdout
   */
  protected printInfo(message: string): void {
    console.log(`ℹ️  ${message}`)
  }
}
