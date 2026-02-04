import { RouteHandler } from "../route-handler"
import { LoadProvidersUseCase } from "@neocode-ai/application"
import type { Request, Response } from "express"

/**
 * HTTP handler for loading providers.
 *
 * Endpoint:
 * GET /api/providers
 *
 * Response:
 * 200 OK: { providers: ProviderResponse[] }
 * 500 Server Error: { error: string }
 */
export class LoadProvidersHandler extends RouteHandler {
  async handle(req: Request, res: Response): Promise<void> {
    try {
      const usecase = new LoadProvidersUseCase(this.container.getProviderRepository(), this.container.getLogger())

      const result = await usecase.execute()

      if (!result.ok) {
        return this.error(res, result.error, 500)
      }

      this.success(res, { providers: result.value }, 200)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.error(res, err, 500)
    }
  }
}
