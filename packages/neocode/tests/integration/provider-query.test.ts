import { describe, it, expect, beforeEach } from "vitest"
import { LoadProvidersUseCase } from "../../src/application/usecases/load-providers"
import { Container } from "../../src/application/di/container"

// Mock provider repository
class MockProviderRepository {
  private providers: any[] = []

  setProviders(providers: any[]) {
    this.providers = providers
  }

  async findById(providerId: string) {
    const provider = this.providers.find((p) => p.id === providerId)
    if (!provider) {
      return { ok: false, error: new Error("Provider not found") }
    }
    return { ok: true, value: provider }
  }

  async listAll() {
    return { ok: true, value: this.providers }
  }

  async save(provider: any) {
    this.providers.push(provider)
    return { ok: true, value: provider }
  }

  async update(provider: any) {
    const index = this.providers.findIndex((p) => p.id === provider.id)
    if (index >= 0) {
      this.providers[index] = provider
    }
    return { ok: true, value: provider }
  }

  async exists(providerId: string) {
    return { ok: true, value: this.providers.some((p) => p.id === providerId) }
  }
}

class MockLogger {
  debug(message: string, data?: any) {}
  info(message: string, data?: any) {}
  warn(message: string, data?: any) {}
  error(message: string, data?: any) {}
}

describe("Integration: Provider Queries", () => {
  let providerRepository: MockProviderRepository
  let logger: MockLogger

  beforeEach(() => {
    providerRepository = new MockProviderRepository()
    logger = new MockLogger()
  })

  it("should load empty provider list", async () => {
    const usecase = new LoadProvidersUseCase(providerRepository, logger)

    const result = await usecase.execute()

    expect(result.ok).toBe(true)
    expect(result.value).toEqual([])
  })

  it("should load all providers with metadata", async () => {
    // Setup test data
    providerRepository.setProviders([
      {
        id: "anthropic",
        name: "anthropic",
        displayName: "Anthropic",
        isCustom: false,
        isEnabled: true,
        models: [{ id: "claude-3-5-sonnet" }, { id: "claude-3-opus" }],
        auth: { type: "api-key", requiresSetup: true },
      },
      {
        id: "openai",
        name: "openai",
        displayName: "OpenAI",
        isCustom: false,
        isEnabled: true,
        models: [{ id: "gpt-4" }, { id: "gpt-4-turbo" }, { id: "gpt-3.5-turbo" }],
        auth: { type: "api-key", requiresSetup: true },
      },
      {
        id: "ollama",
        name: "ollama",
        displayName: "Ollama",
        isCustom: true,
        isEnabled: false,
        models: [],
        auth: { type: "none", requiresSetup: false },
      },
    ])

    const usecase = new LoadProvidersUseCase(providerRepository, logger)

    const result = await usecase.execute()

    expect(result.ok).toBe(true)
    expect(result.value).toHaveLength(3)

    // Verify provider DTO structure
    expect(result.value).toContainEqual({
      id: "anthropic",
      name: "anthropic",
      displayName: "Anthropic",
      isCustom: false,
      isEnabled: true,
      modelCount: 2,
    })

    expect(result.value).toContainEqual({
      id: "openai",
      name: "openai",
      displayName: "OpenAI",
      isCustom: false,
      isEnabled: true,
      modelCount: 3,
    })

    expect(result.value).toContainEqual({
      id: "ollama",
      name: "ollama",
      displayName: "Ollama",
      isCustom: true,
      isEnabled: false,
      modelCount: 0,
    })
  })

  it("should handle repository errors gracefully", async () => {
    // Mock repository that returns error
    class FailingRepository {
      async findById(providerId: string) {
        return { ok: false, error: new Error("Database error") }
      }

      async listAll() {
        return { ok: false, error: new Error("Database error") }
      }

      async save(provider: any) {
        return { ok: false, error: new Error("Database error") }
      }

      async update(provider: any) {
        return { ok: false, error: new Error("Database error") }
      }

      async exists(providerId: string) {
        return { ok: false, error: new Error("Database error") }
      }
    }

    const usecase = new LoadProvidersUseCase(new FailingRepository() as any, logger)

    const result = await usecase.execute()

    expect(result.ok).toBe(false)
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error?.message).toContain("Database error")
  })
})
