import { UseCase, type Command } from "../usecase"
import type { CreateSessionRequest, SessionResponse } from "../dto"
import type { Result } from "@neocode-ai/shared/types/result"
import { Ok, Err } from "@neocode-ai/shared/types/result"
import { Session, SessionFactory } from "@neocode-ai/domain/session"
import type { ISessionRepository } from "@neocode-ai/ports/persistence"
import type { IEventBus } from "@neocode-ai/ports/event-bus"
import type { ILogger } from "@neocode-ai/ports/logger"

/**
 * CreateSessionUseCase orchestrates:
 * 1. Validate input (dto validation)
 * 2. Create domain aggregate (SessionFactory)
 * 3. Persist via port (ISessionRepository)
 * 4. Publish domain event via port (IEventBus)
 * 5. Return DTO to caller
 *
 * No business logic here - all rules in domain layer.
 * Use case just coordinates dependencies.
 */
export class CreateSessionUseCase extends UseCase<CreateSessionRequest, SessionResponse> {
  constructor(
    private sessionRepository: ISessionRepository,
    private eventBus: IEventBus,
    private logger: ILogger,
  ) {
    super()
  }

  async execute(request: CreateSessionRequest): Promise<Result<SessionResponse, Error>> {
    try {
      this.logger.debug("Creating session", { projectPath: request.projectPath })

      // 1. Create domain aggregate using factory
      // Factory ensures valid initial state (idle, default title, etc.)
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`
      const state = SessionFactory.create(
        sessionId as any, // Brand type - in real code, use branded factory
        request.projectPath,
        request.title,
        request.parentSessionId,
      )

      const session = new Session(state)

      // 2. Persist via repository port
      const saveResult = await this.sessionRepository.save(state)
      if (!saveResult.ok) {
        this.logger.error("Failed to save session", { sessionId, error: saveResult.error })
        return saveResult as any
      }

      // 3. Publish event via event bus port
      // Other services (e.g., analytics, cache invalidation) subscribe
      await this.eventBus.publish({
        type: "SessionCreated",
        sessionId,
        projectPath: request.projectPath,
        timestamp: Date.now(),
      } as any) // IEventBus will enforce type at subscriber

      this.logger.info("Session created", { sessionId })

      // 4. Return DTO (translate domain entity to response)
      return Ok({
        id: session.getState().id,
        projectPath: session.getState().projectPath,
        title: session.getState().title,
        status: session.getState().status,
        messageCount: session.getMessageCount(),
        createdAt: session.getState().createdAt,
        updatedAt: session.getState().updatedAt,
      })
    } catch (error) {
      this.logger.error("CreateSessionUseCase failed", { error })
      return Err(error instanceof Error ? error : new Error(String(error)))
    }
  }
}
