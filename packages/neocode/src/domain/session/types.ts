/**
 * Session Domain - Core types and value objects
 * Pure business logic with no external dependencies
 */

import type { SessionId, ProviderId } from "@neocode-ai/shared/types"
import { z } from "zod"

/**
 * Session status types
 */
export const SessionStatusEnum = z.enum(["idle", "busy", "retry", "completed", "failed"])
export type SessionStatus = z.infer<typeof SessionStatusEnum>

export interface SessionStatusValue {
  type: SessionStatus
  attempt?: number
  message?: string
  nextRetry?: number
}

/**
 * Message types
 */
export interface TextPart {
  type: "text"
  text: string
}

export interface ReasoningPart {
  type: "reasoning"
  text: string
  providerMetadata?: Record<string, unknown>
}

export interface ToolCall {
  state: "call"
  toolCallId: string
  toolName: string
  args: Record<string, unknown>
}

export interface ToolResult {
  state: "result"
  toolCallId: string
  toolName: string
  args: Record<string, unknown>
  result: string
}

export type MessagePart = TextPart | ReasoningPart | ToolCall | ToolResult

export interface Message {
  id: string
  role: "user" | "assistant" | "system"
  parts: MessagePart[]
  timestamp: number
  usage?: {
    inputTokens: number
    outputTokens: number
    cachedTokens?: number
  }
}

/**
 * Session aggregate root
 */
export interface SessionAggregateRoot {
  id: SessionId
  projectPath: string
  title: string
  status: SessionStatusValue
  messages: Message[]
  createdAt: number
  updatedAt: number
  parentSessionId?: SessionId
}

/**
 * Session domain errors
 */
export class SessionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SessionError"
  }
}

export class SessionNotFoundError extends SessionError {
  constructor(sessionId: SessionId) {
    super(`Session not found: ${sessionId}`)
    this.name = "SessionNotFoundError"
  }
}

export class InvalidSessionStateError extends SessionError {
  constructor(currentStatus: SessionStatus, attemptedAction: string) {
    super(`Cannot ${attemptedAction} session in ${currentStatus} state`)
    this.name = "InvalidSessionStateError"
  }
}

/**
 * Business rules for sessions
 */
export const SessionRules = {
  /**
   * Check if session can accept messages
   */
  canAcceptMessages: (status: SessionStatusValue): boolean => {
    return status.type === "idle"
  },

  /**
   * Check if session can be retried
   */
  canRetry: (status: SessionStatusValue): boolean => {
    return status.type === "failed" || status.type === "retry"
  },

  /**
   * Check if session is completed
   */
  isCompleted: (status: SessionStatusValue): boolean => {
    return status.type === "completed" || status.type === "failed"
  },

  /**
   * Validate message before adding to session
   */
  validateMessage: (message: Message): boolean => {
    if (!message.id) return false
    if (!message.role) return false
    if (!Array.isArray(message.parts) || message.parts.length === 0) return false
    if (!Number.isInteger(message.timestamp)) return false
    return true
  },

  /**
   * Calculate session title (avoid duplicates)
   */
  getDefaultTitle: (isChild = false): string => {
    const prefix = isChild ? "Child session - " : "New session - "
    return prefix + new Date().toISOString()
  },

  /**
   * Check if title is auto-generated
   */
  isDefaultTitle: (title: string): boolean => {
    const pattern = /^(New session - |Child session - )\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    return pattern.test(title)
  },
}

/**
 * Session factory
 */
export const SessionFactory = {
  /**
   * Create a new session
   */
  create: (id: SessionId, projectPath: string, parentSessionId?: SessionId): SessionAggregateRoot => {
    const now = Date.now()
    return {
      id,
      projectPath,
      title: SessionRules.getDefaultTitle(!!parentSessionId),
      status: { type: "idle" },
      messages: [],
      createdAt: now,
      updatedAt: now,
      parentSessionId,
    }
  },

  /**
   * Add message to session (business logic)
   */
  addMessage: (session: SessionAggregateRoot, message: Message): SessionAggregateRoot => {
    if (!SessionRules.canAcceptMessages(session.status)) {
      throw new InvalidSessionStateError(session.status.type, "add message to")
    }

    if (!SessionRules.validateMessage(message)) {
      throw new SessionError("Invalid message format")
    }

    return {
      ...session,
      messages: [...session.messages, message],
      updatedAt: Date.now(),
    }
  },

  /**
   * Mark session as busy (processing)
   */
  markBusy: (session: SessionAggregateRoot): SessionAggregateRoot => {
    return {
      ...session,
      status: { type: "busy" },
      updatedAt: Date.now(),
    }
  },

  /**
   * Mark session as completed
   */
  markCompleted: (session: SessionAggregateRoot): SessionAggregateRoot => {
    return {
      ...session,
      status: { type: "completed" },
      updatedAt: Date.now(),
    }
  },

  /**
   * Mark session as failed with retry info
   */
  markRetry: (session: SessionAggregateRoot, message: string): SessionAggregateRoot => {
    const currentAttempt = session.status.attempt ?? 0
    return {
      ...session,
      status: {
        type: "retry",
        attempt: currentAttempt + 1,
        message,
        nextRetry: Date.now() + 1000 * Math.pow(2, currentAttempt),
      },
      updatedAt: Date.now(),
    }
  },
}
