import { CommandHandler } from "../command-handler"
import { CreateSessionUseCase } from "@neocode-ai/application"
import type { CreateSessionRequest } from "@neocode-ai/application"

/**
 * CLI adapter for creating a session.
 *
 * Usage:
 * neocode session create --project /path --title "My Session"
 *
 * Bridge between CLI arguments and use case.
 */
export class CreateSessionCommand extends CommandHandler {
  async execute(options: { project: string; title?: string }): Promise<void> {
    try {
      this.printInfo(`Creating session in project: ${options.project}`)

      const usecase = new CreateSessionUseCase(
        this.container.getSessionRepository(),
        this.container.getEventBus(),
        this.container.getLogger(),
      )

      const request: CreateSessionRequest = {
        projectPath: options.project,
        title: options.title,
      }

      const result = await usecase.execute(request)

      if (!result.ok) {
        this.printError(result.error)
        process.exit(1)
      }

      const session = result.value
      this.printSuccess(`Session created: ${session.id}`)
      console.log(
        JSON.stringify(
          {
            id: session.id,
            projectPath: session.projectPath,
            title: session.title,
            status: session.status,
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
