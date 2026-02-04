import { UseCase, type Command } from "../usecase"
import type { MarkSessionCompletedRequest } from "../dto"
import type { Result } from "@neocode-ai/shared/types/result"
import { Ok, Err } from "@neocode-ai/shared/types/result"
import { Session } from "@neocode-ai/domain/session"
import type { ISessionRepository } from "@neocode-ai/ports/persistence"
import type { IEventBus } from "@neocode-ai/ports/event-bus"
import type { ILogger } from "@neocode-ai/ports/logger"

/**
 * MarkSessionCompletedUseCase transitions session to completed state.
 * Used after LLM response is received and processed successfully.
 * Domain enforces this is only valid from busy state.
 */
export class MarkSessionCompletedUseCase extends UseCase<MarkSessionCompletedRequest, Command> {
  constructor(
    private sessionRepository: ISessionRepository,
    private eventBus: IEventBus,
    private logger: ILogger,
  ) {
    super()
  }

  async execute(request: MarkSessionCompletedRequest): Promise<Result<Command, Error>> {
    try {
      this.logger.debug("Marking session completed", { sessionId: request.sessionId })

      const loadResult = await this.sessionRepository.findById(request.sessionId as any)
      if (!loadResult.ok) {
        return loadResult as any
      }

      const session = new Session(loadResult.value)

      // Domain enforces this is only valid from busy state
      session.markCompleted()

      const saveResult = await this.sessionRepository.update(session.getState())
      if (!saveResult.ok) {
        return saveResult as any
      }

      await this.eventBus.publish({
        type: "SessionCompleted",
        sessionId: request.sessionId,
        timestamp: Date.now(),
      } as any)

      this.logger.info("Session marked completed", { sessionId: request.sessionId })

      return Ok({})
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.logger.error("MarkSessionCompletedUseCase failed", { error: err })
      return Err(err)
    }
  }
}
