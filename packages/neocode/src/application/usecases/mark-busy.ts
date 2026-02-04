import { UseCase, type Command } from "../usecase"
import type { MarkSessionBusyRequest } from "../dto"
import type { Result } from "@neocode-ai/shared/types/result"
import { Ok, Err } from "@neocode-ai/shared/types/result"
import { Session } from "@neocode-ai/domain/session"
import type { ISessionRepository } from "@neocode-ai/ports/persistence"
import type { IEventBus } from "@neocode-ai/ports/event-bus"
import type { ILogger } from "@neocode-ai/ports/logger"

/**
 * MarkSessionBusyUseCase transitions session from idle → busy.
 * Signals that processing has started (e.g., LLM request in progress).
 * Domain enforces this is only valid from idle state.
 */
export class MarkSessionBusyUseCase extends UseCase<MarkSessionBusyRequest, Command> {
  constructor(
    private sessionRepository: ISessionRepository,
    private eventBus: IEventBus,
    private logger: ILogger,
  ) {
    super()
  }

  async execute(request: MarkSessionBusyRequest): Promise<Result<Command, Error>> {
    try {
      this.logger.debug("Marking session busy", { sessionId: request.sessionId })

      const loadResult = await this.sessionRepository.findById(request.sessionId as any)
      if (!loadResult.ok) {
        return loadResult as any
      }

      const session = new Session(loadResult.value)

      // Domain enforces this is only valid from idle state
      // Throws InvalidSessionStateError if not idle
      session.markBusy()

      const saveResult = await this.sessionRepository.update(session.getState())
      if (!saveResult.ok) {
        return saveResult as any
      }

      await this.eventBus.publish({
        type: "SessionStatusChanged",
        sessionId: request.sessionId,
        status: "busy",
        timestamp: Date.now(),
      } as any)

      this.logger.info("Session marked busy", { sessionId: request.sessionId })

      return Ok({})
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.logger.error("MarkSessionBusyUseCase failed", { error: err })
      return Err(err)
    }
  }
}
