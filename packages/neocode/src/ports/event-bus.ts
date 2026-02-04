/**
 * Port interfaces for event handling
 */

import type { SessionDomainEvent } from "../domain/session"
import type { ProviderDomainEvent } from "../domain/provider"

export type DomainEvent = SessionDomainEvent | ProviderDomainEvent

/**
 * Event bus for domain events
 */
export interface IEventBus {
  /**
   * Publish domain event
   */
  publish(event: DomainEvent): Promise<void>

  /**
   * Subscribe to events
   */
  subscribe(handler: IEventHandler): void

  /**
   * Unsubscribe from events
   */
  unsubscribe(handler: IEventHandler): void
}

/**
 * Event handler
 */
export interface IEventHandler {
  handle(event: DomainEvent): Promise<void>
}
