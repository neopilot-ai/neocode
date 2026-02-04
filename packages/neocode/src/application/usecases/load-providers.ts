import { QueryUseCase } from "../usecase"
import type { LoadProvidersRequest, ProviderResponse } from "../dto"
import type { Result } from "@neocode-ai/shared/types/result"
import { Ok, Err } from "@neocode-ai/shared/types/result"
import type { IProviderRepository } from "@neocode-ai/ports/persistence"
import type { ILogger } from "@neocode-ai/ports/logger"

/**
 * LoadProvidersUseCase fetches all available providers.
 * Returns provider list with basic info (name, enabled, model count).
 * QueryUseCase - no request parameter needed, just dependencies.
 */
export class LoadProvidersUseCase extends QueryUseCase<ProviderResponse[]> {
  constructor(
    private providerRepository: IProviderRepository,
    private logger: ILogger,
  ) {
    super()
  }

  async execute(): Promise<Result<ProviderResponse[], Error>> {
    try {
      this.logger.debug("Loading providers")

      const result = await this.providerRepository.listAll()
      if (!result.ok) {
        this.logger.error("Failed to load providers", { error: result.error })
        return result as any
      }

      const providers = result.value.map((provider) => ({
        id: provider.id,
        name: provider.name,
        displayName: provider.displayName,
        isCustom: provider.isCustom,
        isEnabled: provider.isEnabled,
        modelCount: provider.models.length,
      }))

      this.logger.info("Providers loaded", { count: providers.length })

      return Ok(providers)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.logger.error("LoadProvidersUseCase failed", { error: err })
      return Err(err)
    }
  }
}
