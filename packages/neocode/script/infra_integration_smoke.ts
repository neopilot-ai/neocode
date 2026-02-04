import { createContainer, setGlobalContainer } from "../src/application/di/container.ts"
import { registerInfrastructure } from "../src/infrastructure/mod.ts"

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  const container = createContainer()

  const postgresUrl = process.env.DATABASE_URL || "postgres://neocode:secret@localhost:5432/neocode"
  const rabbitUrl = process.env.RABBITMQ_URL || "amqp://guest:guest@localhost:5672"

  // retry registering infra a few times while services start
  const maxAttempts = 10
  let attempt = 0
  while (attempt < maxAttempts) {
    try {
      await registerInfrastructure(container, { postgresUrl, rabbitUrl })
      break
    } catch (err) {
      attempt++
      console.log(
        `registerInfrastructure attempt ${attempt} failed, retrying...`,
        err instanceof Error ? err.message : err,
      )
      await wait(1000)
    }
  }

  try {
    container.validate()
  } catch (err) {
    console.error("Container validation failed, aborting:", err)
    process.exit(2)
  }

  setGlobalContainer(container)

  const sessionRepo: any = container.getSessionRepository()
  const eventBus: any = container.getEventBus()

  const session = {
    id: `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    projectPath: "/tmp/integration-project",
    title: "Integration Smoke Test",
    status: "idle",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  // Save into Postgres
  const saveRes = await sessionRepo.save(session)
  if (!saveRes.ok) {
    console.error("Failed to save session:", saveRes.error)
    process.exit(1)
  }

  // Publish an event
  await eventBus.publish({
    type: "SessionCreated",
    sessionId: session.id,
    projectPath: session.projectPath,
    timestamp: Date.now(),
  })

  // Read back
  const read = await sessionRepo.findById(session.id)
  if (!read.ok) {
    console.error("Failed to read session back:", read.error)
    process.exit(1)
  }

  console.log("Integration smoke succeeded, session read back:", read.value)
  process.exit(0)
}

main().catch((err) => {
  console.error("Integration smoke crashed:", err)
  process.exit(2)
})
