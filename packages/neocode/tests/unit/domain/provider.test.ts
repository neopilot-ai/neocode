/**
 * Unit tests for Provider domain
 */

import { describe, it, expect } from "vitest"
import { ProviderAggregate, ProviderFactory, ProviderRules } from "@neocode-ai/domain/provider"
import type { Provider, Model, ProviderId, ModelId } from "@neocode-ai/domain/provider"
import { providerId, modelId } from "@neocode-ai/shared/types"
import { ModelNotFoundError, ProviderError } from "@neocode-ai/domain/provider"

describe("Provider Domain", () => {
  describe("ProviderFactory.create", () => {
    it("should create provider with auth", () => {
      const id = providerId("anthropic") as ProviderId

      const provider = ProviderFactory.create(id, "anthropic", "Anthropic", {
        type: "api-key",
        requiresSetup: true,
      })

      expect(provider.id).toBe(id)
      expect(provider.name).toBe("anthropic")
      expect(provider.isEnabled).toBe(true)
      expect(provider.models).toHaveLength(0)
    })
  })

  describe("ProviderFactory.addModel", () => {
    it("should add model to provider", () => {
      const providerId_ = providerId("anthropic") as ProviderId
      const modelId_ = modelId("claude-3-opus") as ModelId

      let provider = ProviderFactory.create(providerId_, "anthropic", "Anthropic", {
        type: "api-key",
        requiresSetup: true,
      })

      const model: Model = {
        id: modelId_,
        providerId: providerId_,
        name: "claude-3-opus",
        displayName: "Claude 3 Opus",
        capabilities: {
          reasoning: true,
          streaming: true,
          vision: true,
          audio: false,
          videoInput: false,
          pdfInput: true,
          toolCalling: true,
        },
        contextWindow: 200000,
        maxOutputTokens: 4096,
        cost: { input: 0.015, output: 0.075 },
      }

      provider = ProviderFactory.addModel(provider, model)

      expect(provider.models).toHaveLength(1)
      expect(provider.models[0]).toBe(model)
    })

    it("should reject duplicate model", () => {
      const providerId_ = providerId("anthropic") as ProviderId
      const modelId_ = modelId("claude-3-opus") as ModelId

      let provider = ProviderFactory.create(providerId_, "anthropic", "Anthropic", {
        type: "api-key",
        requiresSetup: true,
      })

      const model: Model = {
        id: modelId_,
        providerId: providerId_,
        name: "claude-3-opus",
        displayName: "Claude 3 Opus",
        capabilities: {
          reasoning: true,
          streaming: true,
          vision: true,
          audio: false,
          videoInput: false,
          pdfInput: true,
          toolCalling: true,
        },
        contextWindow: 200000,
        cost: { input: 0.015, output: 0.075 },
      }

      provider = ProviderFactory.addModel(provider, model)

      expect(() => ProviderFactory.addModel(provider, model)).toThrow(ProviderError)
    })

    it("should reject model with mismatched provider", () => {
      const providerId_ = providerId("anthropic") as ProviderId
      const otherProviderId = providerId("openai") as ProviderId
      const modelId_ = modelId("claude-3-opus") as ModelId

      const provider = ProviderFactory.create(providerId_, "anthropic", "Anthropic", {
        type: "api-key",
        requiresSetup: true,
      })

      const model: Model = {
        id: modelId_,
        providerId: otherProviderId,
        name: "claude-3-opus",
        displayName: "Claude 3 Opus",
        capabilities: {
          reasoning: true,
          streaming: true,
          vision: true,
          audio: false,
          videoInput: false,
          pdfInput: true,
          toolCalling: true,
        },
        contextWindow: 200000,
        cost: { input: 0.015, output: 0.075 },
      }

      expect(() => ProviderFactory.addModel(provider, model)).toThrow(ProviderError)
    })
  })

  describe("ProviderRules.supportsCapability", () => {
    it("should check capability support", () => {
      const model: Model = {
        id: modelId("claude-3-opus") as ModelId,
        providerId: providerId("anthropic") as ProviderId,
        name: "claude-3-opus",
        displayName: "Claude 3 Opus",
        capabilities: {
          reasoning: true,
          streaming: true,
          vision: true,
          audio: false,
          videoInput: false,
          pdfInput: true,
          toolCalling: true,
        },
        contextWindow: 200000,
        cost: { input: 0.015, output: 0.075 },
      }

      expect(ProviderRules.supportsCapability(model, "vision")).toBe(true)
      expect(ProviderRules.supportsCapability(model, "audio")).toBe(false)
    })
  })

  describe("ProviderRules.isAvailable", () => {
    it("should check availability", () => {
      let provider = ProviderFactory.create(providerId("anthropic") as ProviderId, "anthropic", "Anthropic", {
        type: "api-key",
        requiresSetup: true,
      })

      expect(ProviderRules.isAvailable(provider)).toBe(false) // No models

      const model: Model = {
        id: modelId("claude-3-opus") as ModelId,
        providerId: provider.id,
        name: "claude-3-opus",
        displayName: "Claude 3 Opus",
        capabilities: {
          reasoning: true,
          streaming: true,
          vision: true,
          audio: false,
          videoInput: false,
          pdfInput: true,
          toolCalling: true,
        },
        contextWindow: 200000,
        cost: { input: 0.015, output: 0.075 },
      }

      provider = ProviderFactory.addModel(provider, model)

      expect(ProviderRules.isAvailable(provider)).toBe(true) // Has models and enabled
    })
  })

  describe("ProviderAggregate", () => {
    it("should manage provider state through aggregate", () => {
      const provider = ProviderFactory.create(providerId("anthropic") as ProviderId, "anthropic", "Anthropic", {
        type: "api-key",
        requiresSetup: true,
      })

      const aggregate = new ProviderAggregate(provider)

      expect(aggregate.isEnabled()).toBe(true)
      expect(aggregate.getModelCount()).toBe(0)

      aggregate.disable()

      expect(aggregate.isEnabled()).toBe(false)
    })
  })
})
