/**
 * Utility types for common patterns
 */

export type Awaited<T> = T extends Promise<infer U> ? U : T

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

export type Nullable<T> = T | null

export type Optional<T> = T | undefined

export type Readonly<T> = {
  readonly [K in keyof T]: T[K]
}

export type DeepReadonly<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>
}

// Re-export Result from result.ts for convenience
export type { Result } from "./result"
