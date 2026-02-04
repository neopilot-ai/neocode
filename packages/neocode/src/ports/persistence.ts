/**
 * Port interfaces for persistence layer
 * Decouple domain from specific storage implementations
 */

import type { SessionId } from "@neocode-ai/shared/types"
import type { Session, SessionAggregateRoot } from "../domain/session"
import type { Result } from "@neocode-ai/shared/types"

/**
 * Repository for Session aggregate
 * Implementation can be SQLite, in-memory, or any storage backend
 */
export interface ISessionRepository {
  /**
   * Find session by ID
   */
  findById(id: SessionId): Promise<Result<Session>>

  /**
   * Save new session
   */
  save(session: Session): Promise<Result<void>>

  /**
   * Update existing session
   */
  update(session: Session): Promise<Result<void>>

  /**
   * Delete session
   */
  delete(id: SessionId): Promise<Result<void>>

  /**
   * List all sessions for a project
   */
  listByProject(projectPath: string): Promise<Result<SessionId[]>>

  /**
   * Check if session exists
   */
  exists(id: SessionId): Promise<Result<boolean>>
}

/**
 * Repository for Provider domain
 */
import type { Provider, ProviderId } from "../domain/provider"

export interface IProviderRepository {
  /**
   * Find provider by ID
   */
  findById(id: ProviderId): Promise<Result<Provider>>

  /**
   * List all providers
   */
  listAll(): Promise<Result<Provider[]>>

  /**
   * Save provider
   */
  save(provider: Provider): Promise<Result<void>>

  /**
   * Update provider
   */
  update(provider: Provider): Promise<Result<void>>

  /**
   * Check if provider exists
   */
  exists(id: ProviderId): Promise<Result<boolean>>
}
