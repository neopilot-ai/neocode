import { RouteHandler } from "../route-handler"
import { CreateSessionUseCase } from "@neocode-ai/application"
import type { Request, Response } from "express"

/**
 * HTTP handler for creating a session.
 *
 * Endpoint:
 * POST /api/sessions
 * Body: { projectPath: string, title?: string }
 *
 * Response:
 * 201 Created: { id, projectPath, title, status, messageCount, ... }
 * 400 Bad Request: { error: string }
 */
export class CreateSessionHandler extends RouteHandler {
  async handle(req: Request, res: Response): Promise<void> {
    try {
      // Validate input
      const validation = this.validateRequired(req.body, ["projectPath"])
      if (validation) {
        return this.error(res, validation)
      }

      const usecase = new CreateSessionUseCase(
        this.container.getSessionRepository(),
        this.container.getEventBus(),
        this.container.getLogger(),
      )

      const result = await usecase.execute({
        projectPath: req.body.projectPath,
        title: req.body.title,
      })

      if (!result.ok) {
        return this.error(res, result.error)
      }

      this.success(res, result.value, 201)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.error(res, err, 500)
    }
  }
}
