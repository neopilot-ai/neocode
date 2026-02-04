import { UseCase } from "../usecase"
import type { AddMessageRequest, MessageResponse } from "../dto"
import type { Result } from "@neocode-ai/shared/types/result"
import { Ok, Err } from "@neocode-ai/shared/types/result"
import { Session } from "@neocode-ai/domain/session"
import type { ISessionRepository } from "@neocode-ai/ports/persistence"
import type { IEventBus } from "@neocode-ai/ports/event-bus"
import type { ILogger } from "@neocode-ai/ports/logger"

/**
 * AddMessageToSessionUseCase orchestrates:
 * 1. Load session from repository
 * 2. Add message via domain aggregate (validation happens here)
 * 3. Save updated session
 * 4. Publish event
 * 5. Return DTO
 *
 * Domain layer enforces business rules:
 * - Can't add message if session status isn't idle
 * - Message validation (required fields, type checks, etc.)
 */
export class AddMessageToSessionUseCase extends UseCase<AddMessageRequest, MessageResponse> {
  constructor(
    private sessionRepository: ISessionRepository,
    private eventBus: IEventBus,
    private logger: ILogger,
  ) {
    super()
  }

  async execute(request: AddMessageRequest): Promise<Result<MessageResponse, Error>> {
    try {
      this.logger.debug("Adding message to session", { sessionId: request.sessionId })

      // 1. Load session from repository
      const loadResult = await this.sessionRepository.findById(request.sessionId as any)
      if (!loadResult.ok) {
        this.logger.error("Session not found", { sessionId: request.sessionId })
        return loadResult as any
      }

      const state = loadResult.value
      const session = new Session(state)

      // 2. Add message via domain aggregate
      // This will throw InvalidSessionStateError if status isn't idle
      // Message validation happens here (SessionRules.validateMessage)
      const message = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        role: request.role,
        parts: request.parts.map((p) => {
          if (p.type === "text") return { type: "text" as const, text: p.text }
          if (p.type === "reasoning") return { type: "reasoning" as const, content: p.content }
          if (p.type === "tool-call") {
            return {
              type: "tool-call" as const,
              toolName: p.toolName,
              input: p.input,
            }
          }
          if (p.type === "tool-result") {
            return {
              type: "tool-result" as const,
              toolName: p.toolName,
              output: p.output,
            }
          }
          throw new Error(`Unknown message part type: ${(p as any).type}`)
        }),
        timestamp: Date.now(),
      }

      session.addMessage(message) // Throws if invalid state

      // 3. Save updated session
      const saveResult = await this.sessionRepository.update(session.getState())
      if (!saveResult.ok) {
        this.logger.error("Failed to update session", {
          sessionId: request.sessionId,
          error: saveResult.error,
        })
        return saveResult as any
      }

      // 4. Publish event
      await this.eventBus.publish({
        type: "SessionMessageAdded",
        sessionId: request.sessionId,
        messageId: message.id,
        role: request.role,
        timestamp: Date.now(),
      } as any)

      this.logger.info("Message added to session", {
        sessionId: request.sessionId,
        messageId: message.id,
      })

      // 5. Return message as DTO
      return Ok({
        id: message.id,
        role: message.role,
        parts: request.parts,
        timestamp: message.timestamp,
      })
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.logger.error("AddMessageToSessionUseCase failed", { error: err })
      return Err(err)
    }
  }
}
