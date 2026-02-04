/**
 * Session domain events
 * Immutable records of what happened
 */

import type { SessionId } from "@neocode-ai/shared/types"
import type { Message, SessionStatus } from "./types"

export interface SessionCreatedEvent {
  type: "session.created"
  sessionId: SessionId
  projectPath: string
  timestamp: number
}

export interface SessionMessageAddedEvent {
  type: "session.message_added"
  sessionId: SessionId
  message: Message
  timestamp: number
}

export interface SessionStatusChangedEvent {
  type: "session.status_changed"
  sessionId: SessionId
  previousStatus: SessionStatus
  newStatus: SessionStatus
  timestamp: number
}

export interface SessionCompletedEvent {
  type: "session.completed"
  sessionId: SessionId
  messageCount: number
  duration: number
  timestamp: number
}

export interface SessionFailedEvent {
  type: "session.failed"
  sessionId: SessionId
  reason: string
  timestamp: number
}

export type SessionDomainEvent =
  | SessionCreatedEvent
  | SessionMessageAddedEvent
  | SessionStatusChangedEvent
  | SessionCompletedEvent
  | SessionFailedEvent

/**
 * Event publisher interface (to be injected)
 */
export interface ISessionEventPublisher {
  publish(event: SessionDomainEvent): Promise<void>
}
