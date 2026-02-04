/**
 * Branded types for type safety
 * Prevents accidentally mixing different ID types
 */

export type Brand<T, B extends string> = T & { readonly __brand: B }

export const createBrand = <T, B extends string>(value: T): Brand<T, B> => value as Brand<T, B>

/**
 * Common branded types
 */
export type SessionId = Brand<string, "SessionId">
export type ProjectPath = Brand<string, "ProjectPath">
export type ModelId = Brand<string, "ModelId">
export type ProviderId = Brand<string, "ProviderId">
export type UserId = Brand<string, "UserId">

export const sessionId = (value: string): SessionId => createBrand<string, "SessionId">(value)
export const projectPath = (value: string): ProjectPath => createBrand<string, "ProjectPath">(value)
export const modelId = (value: string): ModelId => createBrand<string, "ModelId">(value)
export const providerId = (value: string): ProviderId => createBrand<string, "ProviderId">(value)
export const userId = (value: string): UserId => createBrand<string, "UserId">(value)
