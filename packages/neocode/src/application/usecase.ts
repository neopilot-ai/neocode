import type { Result } from "@neocode-ai/shared/types/result"

/**
 * Base class for all use cases. Defines the contract for handling requests
 * and returning results with proper error handling.
 *
 * Use cases orchestrate domain logic with infrastructure (ports).
 * They should never contain business logic - that belongs in the domain.
 */
export abstract class UseCase<Request, Response> {
  abstract execute(request: Request): Promise<Result<Response, Error>>
}

/**
 * Use case that doesn't require a request parameter.
 * Used for queries that just need dependencies (e.g., list all providers).
 */
export abstract class QueryUseCase<Response> {
  abstract execute(): Promise<Result<Response, Error>>
}

/**
 * Use case command response for operations that just need success/failure.
 * Useful for actions like enable provider, delete session, etc.
 */
export type Command = Record<string, never>

/**
 * DTO for paginated queries.
 * Apply pagination at query boundary, not in domain.
 */
export type PaginatedRequest<T> = T & {
  page: number
  limit: number
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}
