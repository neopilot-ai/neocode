import type { Container } from "@neocode-ai/application"

/**
 * TUI Event Handler base class.
 * TUI handlers bridge between Solid.js event context and use cases.
 *
 * Pattern:
 * 1. Extend TuiHandler
 * 2. Implement handle() with TUI event logic
 * 3. Use this.container to access use cases
 * 4. Use this.showToast/error for user feedback
 * 5. Return Result or Promise<Result> for consistency
 *
 * TUI handlers are async-aware since Solid.js uses createResource
 * and can display loading states naturally.
 */
export abstract class TuiHandler {
  constructor(protected container: Container) {}

  /**
   * Handle the TUI event with given parameters.
   * Return Result<T, Error> for type-safe error handling.
   */
  abstract execute(...args: any[]): Promise<any>

  /**
   * Show toast notification to user (from TUI context)
   * Typically called from useToast() in Solid component
   */
  protected showToast(message: string, type: "info" | "success" | "error" = "info"): void {
    // This is typically called from a Solid.js component context
    // The actual toast is shown through TUI's context system
    console.log(`[${type.toUpperCase()}] ${message}`)
  }

  /**
   * Get use case dependencies
   */
  protected getSessionRepository() {
    return this.container.getSessionRepository()
  }

  protected getProviderRepository() {
    return this.container.getProviderRepository()
  }

  protected getEventBus() {
    return this.container.getEventBus()
  }

  protected getLogger() {
    return this.container.getLogger()
  }
}
