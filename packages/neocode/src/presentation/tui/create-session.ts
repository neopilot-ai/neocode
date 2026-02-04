import { TuiHandler } from "../tui-handler"
import { CreateSessionUseCase } from "@neocode-ai/application"
import type { CreateSessionRequest } from "@neocode-ai/application"

/**
 * TUI event handler for creating a session.
 *
 * Used from TUI component:
 * const handler = new CreateSessionTuiHandler(container)
 * const [session, { mutate }] = createResource(() => handler.execute({
 *   projectPath: local.projectPath,
 *   title: input.value
 * }))
 */
export class CreateSessionTuiHandler extends TuiHandler {
  async execute(request: CreateSessionRequest): Promise<any> {
    try {
      this.getLogger().info("TUI: Creating session", { projectPath: request.projectPath })

      const usecase = new CreateSessionUseCase(this.getSessionRepository(), this.getEventBus(), this.getLogger())

      const result = await usecase.execute(request)

      if (!result.ok) {
        this.getLogger().error("TUI: Failed to create session", { error: result.error })
        throw result.error
      }

      this.showToast(`Session created: ${result.value.id}`, "success")
      return result.value
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.getLogger().error("CreateSessionTuiHandler failed", { error: err })
      throw err
    }
  }
}
