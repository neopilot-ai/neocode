import type { ISessionRepository } from "@neocode-ai/ports/persistence"
import type { IProviderRepository } from "@neocode-ai/ports/persistence"
import type { IEventBus } from "@neocode-ai/ports/event-bus"
import type { ILogger } from "@neocode-ai/ports/logger"

/**
 * Dependency Injection container.
 * Manages all service dependencies and provides them to use cases.
 *
 * The container holds references to ports (infrastructure interfaces).
 * Concrete implementations are injected at startup.
 *
 * Benefits:
 * - Use cases don't know about concrete implementations
 * - Easy to swap implementations (testing, different databases, etc.)
 * - Single point to wire up all dependencies
 * - Type-safe dependency resolution
 */
export class Container {
  private sessionRepository: ISessionRepository | null = null
  private providerRepository: IProviderRepository | null = null
  private eventBus: IEventBus | null = null
  private logger: ILogger | null = null

  /**
   * Register (bind) a concrete implementation to a port interface.
   */
  register<T>(name: string, implementation: T): void {
    switch (name) {
      case "sessionRepository":
        this.sessionRepository = implementation as ISessionRepository
        break
      case "providerRepository":
        this.providerRepository = implementation as IProviderRepository
        break
      case "eventBus":
        this.eventBus = implementation as IEventBus
        break
      case "logger":
        this.logger = implementation as ILogger
        break
      default:
        throw new Error(`Unknown service: ${name}`)
    }
  }

  /**
   * Resolve (get) a registered service.
   * Throws if not registered (fail-fast).
   */
  resolve<T>(name: string): T {
    switch (name) {
      case "sessionRepository":
        if (!this.sessionRepository) {
          throw new Error("sessionRepository not registered")
        }
        return this.sessionRepository as T
      case "providerRepository":
        if (!this.providerRepository) {
          throw new Error("providerRepository not registered")
        }
        return this.providerRepository as T
      case "eventBus":
        if (!this.eventBus) {
          throw new Error("eventBus not registered")
        }
        return this.eventBus as T
      case "logger":
        if (!this.logger) {
          throw new Error("logger not registered")
        }
        return this.logger as T
      default:
        throw new Error(`Unknown service: ${name}`)
    }
  }

  /**
   * Convenience getters for common services.
   */
  getSessionRepository(): ISessionRepository {
    return this.resolve("sessionRepository")
  }

  getProviderRepository(): IProviderRepository {
    return this.resolve("providerRepository")
  }

  getEventBus(): IEventBus {
    return this.resolve("eventBus")
  }

  getLogger(): ILogger {
    return this.resolve("logger")
  }

  /**
   * Check if a service is registered.
   */
  has(name: string): boolean {
    switch (name) {
      case "sessionRepository":
        return this.sessionRepository !== null
      case "providerRepository":
        return this.providerRepository !== null
      case "eventBus":
        return this.eventBus !== null
      case "logger":
        return this.logger !== null
      default:
        return false
    }
  }

  /**
   * Clear all registered services. Useful for testing.
   */
  clear(): void {
    this.sessionRepository = null
    this.providerRepository = null
    this.eventBus = null
    this.logger = null
  }

  /**
   * Verify all required services are registered.
   * Call at startup to fail-fast if dependencies are misconfigured.
   */
  validate(): void {
    const required = ["sessionRepository", "providerRepository", "eventBus", "logger"]
    const missing = required.filter((name) => !this.has(name))
    if (missing.length > 0) {
      throw new Error(`Missing required services: ${missing.join(", ")}`)
    }
  }
}

/**
 * Global container instance.
 * In a real app, you might use a DI library or create per-request instances.
 */
let globalContainer: Container | null = null

export function setGlobalContainer(container: Container): void {
  globalContainer = container
}

export function getGlobalContainer(): Container {
  if (!globalContainer) {
    throw new Error("Global container not initialized")
  }
  return globalContainer
}

export function createContainer(): Container {
  return new Container()
}
