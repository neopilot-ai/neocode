import { TuiHandler } from "../tui-handler"
import { LoadProvidersUseCase } from "@neocode-ai/application"

/**
 * TUI event handler for loading providers.
 *
 * Used from TUI component (like dialog-model.tsx):
 * const handler = new LoadProvidersTuiHandler(container)
 * const [providers] = createResource(() => handler.execute())
 *
 * Then use providers() to access the data in the template.
 */
export class LoadProvidersTuiHandler extends TuiHandler {
  async execute(): Promise<any> {
    try {
      this.getLogger().debug("TUI: Loading providers")

      const usecase = new LoadProvidersUseCase(this.getProviderRepository(), this.getLogger())

      const result = await usecase.execute()

      if (!result.ok) {
        this.getLogger().error("TUI: Failed to load providers", { error: result.error })
        throw result.error
      }

      this.getLogger().info("TUI: Providers loaded", { count: result.value.length })
      return result.value
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.getLogger().error("LoadProvidersTuiHandler failed", { error: err })
      throw err
    }
  }
}
