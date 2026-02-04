import { CommandHandler } from "../command-handler"
import { AddMessageToSessionUseCase } from "@neocode-ai/application"
import type { AddMessageRequest } from "@neocode-ai/application"

/**
 * CLI adapter for adding message to session.
 *
 * Usage:
 * neocode session add-message --session sess_123 --role user --text "Hello"
 *
 * Bridge between CLI arguments and use case.
 */
export class AddMessageCommand extends CommandHandler {
  async execute(options: { session: string; role: "user" | "assistant" | "system"; text: string }): Promise<void> {
    try {
      this.printInfo(`Adding message to session: ${options.session}`)

      const usecase = new AddMessageToSessionUseCase(
        this.container.getSessionRepository(),
        this.container.getEventBus(),
        this.container.getLogger(),
      )

      const request: AddMessageRequest = {
        sessionId: options.session,
        role: options.role,
        parts: [{ type: "text", text: options.text }],
      }

      const result = await usecase.execute(request)

      if (!result.ok) {
        this.printError(result.error)
        process.exit(1)
      }

      const message = result.value
      this.printSuccess(`Message added: ${message.id}`)
      console.log(
        JSON.stringify(
          {
            id: message.id,
            role: message.role,
            timestamp: message.timestamp,
          },
          null,
          2,
        ),
      )
    } catch (error) {
      this.printError(error instanceof Error ? error : new Error(String(error)))
      process.exit(1)
    }
  }
}
