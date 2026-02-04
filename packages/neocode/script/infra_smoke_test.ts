import { createContainer, setGlobalContainer } from "../src/application/di/container.ts"
import { registerInfrastructure } from "../src/infrastructure/mod.ts"

async function main() {
  const container = createContainer()
  // register in-memory infra for quick local smoke test
  await registerInfrastructure(container, { useInMemory: true })
  container.validate()
  setGlobalContainer(container)

  const sessionRepo: any = container.getSessionRepository()
  const eventBus: any = container.getEventBus()
  const logger: any = container.getLogger()

  const session = {
    id: `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    projectPath: "/tmp/smoke-project",
    title: "Smoke Test",
    status: "idle",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  try {
    const saveRes = await sessionRepo.save(session)
    if (!saveRes.ok) {
      console.error("Failed to save session:", saveRes.error)
      process.exit(1)
    }

    await eventBus.publish({
      type: "SessionCreated",
      sessionId: session.id,
      projectPath: session.projectPath,
      timestamp: Date.now(),
    })

    console.log("Smoke test succeeded:", session)
    process.exit(0)
  } catch (err) {
    console.error("Smoke test crashed:", err)
    process.exit(2)
  }
}

main()
