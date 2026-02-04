import { RouteHandler } from "../route-handler"
import { AddMessageToSessionUseCase } from "@neocode-ai/application"
import type { Request, Response } from "express"

/**
 * HTTP handler for adding message to session.
 *
 * Endpoint:
 * POST /api/sessions/:sessionId/messages
 * Body: { role: 'user'|'assistant'|'system', parts: MessagePartDTO[] }
 *
 * Response:
 * 200 OK: { id, role, parts, timestamp }
 * 400 Bad Request: { error: string }
 * 404 Not Found: { error: string }
 */
export class AddMessageHandler extends RouteHandler {
  async handle(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.params.sessionId

      // Validate input
      const validation = this.validateRequired(req.body, ["role", "parts"])
      if (validation) {
        return this.error(res, validation)
      }

      const usecase = new AddMessageToSessionUseCase(
        this.container.getSessionRepository(),
        this.container.getEventBus(),
        this.container.getLogger(),
      )

      const result = await usecase.execute({
        sessionId,
        role: req.body.role,
        parts: req.body.parts,
      })

      if (!result.ok) {
        const statusCode = result.error.message.includes("not found") ? 404 : 400
        return this.error(res, result.error, statusCode)
      }

      this.success(res, result.value, 200)
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.error(res, err, 500)
    }
  }
}
