/**
 * Public API for shared types
 * Only export intentional types; keep internals private
 */

export type { Result, AsyncResult } from "./result"
export { Ok, Err, isOk, isErr, mapOk, mapErr, flatMap, getOrThrow, getOrDefault } from "./result"

export type { Brand, SessionId, ProjectPath, ModelId, ProviderId, UserId } from "./branded"
export { createBrand, sessionId, projectPath, modelId, providerId, userId } from "./branded"

export type { Awaited, Nullable, Optional, Readonly, DeepReadonly } from "./common"
