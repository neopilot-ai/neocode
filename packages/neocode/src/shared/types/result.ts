/**
 * Result type for error handling
 * Represents either a successful value (Ok) or an error (Err)
 */
export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }

export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error })

export const isOk = <T, E>(result: Result<T, E>): result is { ok: true; value: T } => result.ok

export const isErr = <T, E>(result: Result<T, E>): result is { ok: false; error: E } => !result.ok

export const mapOk = <T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> =>
  isOk(result) ? Ok(fn(result.value)) : result

export const mapErr = <T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> =>
  isErr(result) ? Err(fn(result.error)) : result

export const flatMap = <T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> =>
  isOk(result) ? fn(result.value) : result

export const getOrThrow = <T, E extends Error>(result: Result<T, E>): T => {
  if (isOk(result)) return result.value
  throw result.error
}

export const getOrDefault = <T, E>(result: Result<T, E>, defaultValue: T): T =>
  isOk(result) ? result.value : defaultValue
