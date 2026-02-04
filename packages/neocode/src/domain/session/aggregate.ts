/**
 * Session aggregate root - Pure domain logic
 * No external dependencies, no I/O operations
 */

import type { SessionAggregateRoot, Message } from "./types"
import { SessionFactory, InvalidSessionStateError, SessionError, SessionRules } from "./types"

/**
 * Session aggregate - all state mutations through factory
 */
export class Session {
  private state: SessionAggregateRoot

  constructor(state: SessionAggregateRoot) {
    this.state = state
  }

  /**
   * Get current state (immutable)
   */
  getState(): Readonly<SessionAggregateRoot> {
    return Object.freeze({ ...this.state })
  }

  /**
   * Add message to session
   * @throws InvalidSessionStateError if session cannot accept messages
   * @throws SessionError if message is invalid
   */
  addMessage(message: Message): void {
    this.state = SessionFactory.addMessage(this.state, message)
  }

  /**
   * Mark as busy (processing started)
   */
  markBusy(): void {
    this.state = SessionFactory.markBusy(this.state)
  }

  /**
   * Mark as completed
   */
  markCompleted(): void {
    this.state = SessionFactory.markCompleted(this.state)
  }

  /**
   * Mark as failed with retry info
   */
  markRetry(message: string): void {
    this.state = SessionFactory.markRetry(this.state, message)
  }

  /**
   * Update title
   */
  setTitle(title: string): void {
    if (!title) throw new SessionError("Title cannot be empty")
    this.state = { ...this.state, title, updatedAt: Date.now() }
  }

  /**
   * Check if can process messages
   */
  canAcceptMessages(): boolean {
    return SessionRules.canAcceptMessages(this.state.status)
  }

  /**
   * Check if is completed
   */
  isCompleted(): boolean {
    return SessionRules.isCompleted(this.state.status)
  }

  /**
   * Check if can retry
   */
  canRetry(): boolean {
    return SessionRules.canRetry(this.state.status)
  }

  /**
   * Get message count
   */
  getMessageCount(): number {
    return this.state.messages.length
  }

  /**
   * Get last message
   */
  getLastMessage(): Message | undefined {
    return this.state.messages[this.state.messages.length - 1]
  }

  /**
   * Create from factory
   */
  static create = SessionFactory.create
}
