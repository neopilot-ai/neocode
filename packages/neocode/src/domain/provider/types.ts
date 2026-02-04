/**
 * Provider Domain - Core types and business rules
 * Pure business logic with no external dependencies
 */

import type { ProviderId, ModelId } from "@neocode-ai/shared/types"
import { z } from "zod"

/**
 * Model capabilities
 */
export interface ModelCapabilities {
  reasoning: boolean
  streaming: boolean
  vision: boolean
  audio: boolean
  videoInput: boolean
  pdfInput: boolean
  toolCalling: boolean
}

/**
 * Model cost structure
 */
export interface ModelCost {
  input: number
  output: number
  cache?: {
    read: number
    write: number
  }
}

/**
 * Model domain entity
 */
export interface Model {
  id: ModelId
  providerId: ProviderId
  name: string
  displayName: string
  description?: string
  capabilities: ModelCapabilities
  contextWindow: number
  maxOutputTokens?: number
  cost: ModelCost
  deprecated?: boolean
  releaseDate?: number
}

/**
 * Provider auth types
 */
export type ProviderAuthType = "oauth" | "api-key" | "none"

export interface ProviderAuthInfo {
  type: ProviderAuthType
  requiresSetup: boolean
  instructions?: string
}

/**
 * Provider domain entity
 */
export interface Provider {
  id: ProviderId
  name: string
  displayName: string
  description?: string
  website?: string
  isCustom: boolean
  isEnabled: boolean
  auth: ProviderAuthInfo
  models: Model[]
}

/**
 * Provider domain errors
 */
export class ProviderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ProviderError"
  }
}

export class ModelNotFoundError extends ProviderError {
  constructor(modelId: ModelId) {
    super(`Model not found: ${modelId}`)
    this.name = "ModelNotFoundError"
  }
}

export class ProviderNotFoundError extends ProviderError {
  constructor(providerId: ProviderId) {
    super(`Provider not found: ${providerId}`)
    this.name = "ProviderNotFoundError"
  }
}

export class UnsupportedCapabilityError extends ProviderError {
  constructor(modelId: ModelId, capability: keyof ModelCapabilities) {
    super(`Model ${modelId} does not support ${capability}`)
    this.name = "UnsupportedCapabilityError"
  }
}

/**
 * Business rules for providers
 */
export const ProviderRules = {
  /**
   * Check if model supports capability
   */
  supportsCapability: (model: Model, capability: keyof ModelCapabilities): boolean => {
    return model.capabilities[capability] === true
  },

  /**
   * Check if provider is available for use
   */
  isAvailable: (provider: Provider): boolean => {
    return provider.isEnabled && provider.models.length > 0
  },

  /**
   * Find best model for a capability
   */
  findBestModel: (provider: Provider, capability: keyof ModelCapabilities): Model | undefined => {
    return provider.models
      .filter((m) => m.capabilities[capability])
      .sort((a, b) => {
        // Prefer newer models
        const aDate = a.releaseDate ?? 0
        const bDate = b.releaseDate ?? 0
        return bDate - aDate
      })[0]
  },

  /**
   * Filter models by capability
   */
  filterByCapability: (models: Model[], capability: keyof ModelCapabilities): Model[] => {
    return models.filter((m) => m.capabilities[capability])
  },

  /**
   * Check if provider requires authentication
   */
  requiresAuth: (provider: Provider): boolean => {
    return provider.auth.type !== "none"
  },

  /**
   * Validate model cost data
   */
  isValidCost: (cost: ModelCost): boolean => {
    return typeof cost.input === "number" && typeof cost.output === "number" && cost.input >= 0 && cost.output >= 0
  },
}

/**
 * Provider factory
 */
export const ProviderFactory = {
  /**
   * Create provider
   */
  create: (id: ProviderId, name: string, displayName: string, auth: ProviderAuthInfo): Provider => {
    return {
      id,
      name,
      displayName,
      isCustom: false,
      isEnabled: true,
      auth,
      models: [],
    }
  },

  /**
   * Add model to provider
   */
  addModel: (provider: Provider, model: Model): Provider => {
    if (model.providerId !== provider.id) {
      throw new ProviderError(`Model provider ID mismatch: ${model.providerId} !== ${provider.id}`)
    }

    const exists = provider.models.find((m) => m.id === model.id)
    if (exists) {
      throw new ProviderError(`Model already exists: ${model.id}`)
    }

    return {
      ...provider,
      models: [...provider.models, model],
    }
  },

  /**
   * Update model in provider
   */
  updateModel: (provider: Provider, model: Model): Provider => {
    if (model.providerId !== provider.id) {
      throw new ProviderError(`Model provider ID mismatch`)
    }

    return {
      ...provider,
      models: provider.models.map((m) => (m.id === model.id ? model : m)),
    }
  },

  /**
   * Remove model from provider
   */
  removeModel: (provider: Provider, modelId: ModelId): Provider => {
    return {
      ...provider,
      models: provider.models.filter((m) => m.id !== modelId),
    }
  },

  /**
   * Enable/disable provider
   */
  setEnabled: (provider: Provider, enabled: boolean): Provider => {
    return {
      ...provider,
      isEnabled: enabled,
    }
  },
}
