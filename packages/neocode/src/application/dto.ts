import type { Message, MessagePart } from "@neocode-ai/domain/session"
import type { Model, Provider } from "@neocode-ai/domain/provider"

/**
 * Data Transfer Objects (DTOs) for application layer requests/responses.
 * DTOs translate between domain entities and external representations.
 * They define the contract for controller/API/CLI input and output.
 */

// Session DTOs
export type CreateSessionRequest = {
  projectPath: string
  title?: string
  parentSessionId?: string
}

export type SessionResponse = {
  id: string
  projectPath: string
  title: string
  status: string
  messageCount: number
  createdAt: number
  updatedAt: number
}

export type AddMessageRequest = {
  sessionId: string
  role: "user" | "assistant" | "system"
  parts: MessagePartDTO[]
}

export type MessagePartDTO =
  | { type: "text"; text: string }
  | { type: "reasoning"; content: string }
  | { type: "tool-call"; toolName: string; input: unknown }
  | { type: "tool-result"; toolName: string; output: unknown }

export type MessageResponse = {
  id: string
  role: "user" | "assistant" | "system"
  parts: MessagePartDTO[]
  timestamp: number
}

export type MarkSessionBusyRequest = {
  sessionId: string
}

export type MarkSessionCompletedRequest = {
  sessionId: string
}

export type MarkSessionRetryRequest = {
  sessionId: string
  reason: string
}

// Provider DTOs
export type LoadProvidersRequest = Record<string, never>

export type ProviderResponse = {
  id: string
  name: string
  displayName: string
  isCustom: boolean
  isEnabled: boolean
  modelCount: number
}

export type ModelResponse = {
  id: string
  providerId: string
  name: string
  displayName: string
  capabilities: string[]
  contextWindow: number
  maxOutputTokens?: number
}

export type GetProviderDetailRequest = {
  providerId: string
}

export type GetProviderDetailResponse = ProviderResponse & {
  models: ModelResponse[]
  auth: {
    type: string
    requiresSetup: boolean
  }
}

export type EnableProviderRequest = {
  providerId: string
}

export type DisableProviderRequest = {
  providerId: string
}

// Session list/search DTOs
export type ListSessionsRequest = {
  projectPath: string
  limit?: number
  offset?: number
}

export type ListSessionsResponse = {
  sessions: SessionResponse[]
  total: number
}

export type GetSessionDetailRequest = {
  sessionId: string
}

export type GetSessionDetailResponse = SessionResponse & {
  messages: MessageResponse[]
}
