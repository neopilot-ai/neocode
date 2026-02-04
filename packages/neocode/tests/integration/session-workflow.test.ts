import { describe, it, expect, beforeEach } from "vitest"
import { CreateSessionUseCase } from "../../src/application/usecases/create-session"
import { AddMessageToSessionUseCase } from "../../src/application/usecases/add-message"
import { MarkSessionBusyUseCase } from "../../src/application/usecases/mark-busy"
import { MarkSessionCompletedUseCase } from "../../src/application/usecases/mark-completed"
import { Container } from "../../src/application/di/container"

// Mock implementations for testing
class MockSessionRepository {
  private sessions: Map<string, any> = new Map()
  private callLog: any[] = []

  async save(state: any) {
    this.callLog.push({ method: "save", sessionId: state.id })
    this.sessions.set(state.id, state)
    return { ok: true, value: state }
  }

  async findById(sessionId: string) {
    const session = this.sessions.get(sessionId)
    if (!session) {
      return { ok: false, error: new Error("Session not found") }
    }
    return { ok: true, value: session }
  }

  async update(state: any) {
    this.callLog.push({ method: "update", sessionId: state.id })
    this.sessions.set(state.id, state)
    return { ok: true, value: state }
  }

  async delete(sessionId: string) {
    this.sessions.delete(sessionId)
    return { ok: true, value: {} }
  }

  async listByProject(projectPath: string) {
    const sessions = Array.from(this.sessions.values()).filter((s) => s.projectPath === projectPath)
    return { ok: true, value: sessions }
  }

  async exists(sessionId: string) {
    return { ok: true, value: this.sessions.has(sessionId) }
  }

  getCallLog() {
    return this.callLog
  }
}

class MockProviderRepository {
  async findById(providerId: string) {
    return { ok: false, error: new Error("Not implemented") }
  }

  async listAll() {
    return { ok: true, value: [] }
  }

  async save(provider: any) {
    return { ok: true, value: provider }
  }

  async update(provider: any) {
    return { ok: true, value: provider }
  }

  async exists(providerId: string) {
    return { ok: true, value: false }
  }
}

class MockEventBus {
  private events: any[] = []

  async publish(event: any) {
    this.events.push(event)
  }

  async subscribe(eventType: string, handler: any) {
    // Not used in this test
  }

  async unsubscribe(eventType: string) {
    // Not used in this test
  }

  getEvents() {
    return this.events
  }
}

class MockLogger {
  private logs: any[] = []

  debug(message: string, data?: any) {
    this.logs.push({ level: "debug", message, data })
  }

  info(message: string, data?: any) {
    this.logs.push({ level: "info", message, data })
  }

  warn(message: string, data?: any) {
    this.logs.push({ level: "warn", message, data })
  }

  error(message: string, data?: any) {
    this.logs.push({ level: "error", message, data })
  }

  getLogs() {
    return this.logs
  }
}

describe("Integration: Session Workflows", () => {
  let container: Container
  let sessionRepository: MockSessionRepository
  let eventBus: MockEventBus
  let logger: MockLogger

  beforeEach(() => {
    sessionRepository = new MockSessionRepository()
    eventBus = new MockEventBus()
    logger = new MockLogger()

    container = new Container()
    container.register("sessionRepository", sessionRepository)
    container.register("providerRepository", new MockProviderRepository())
    container.register("eventBus", eventBus)
    container.register("logger", logger)
  })

  it("should create session with idle status", async () => {
    const usecase = new CreateSessionUseCase(sessionRepository, eventBus, logger)

    const result = await usecase.execute({
      projectPath: "/project",
      title: "Test Session",
    })

    expect(result.ok).toBe(true)
    expect(result.value).toMatchObject({
      projectPath: "/project",
      title: "Test Session",
      status: "idle",
      messageCount: 0,
    })

    // Verify event was published
    expect(eventBus.getEvents()).toHaveLength(1)
    expect(eventBus.getEvents()[0].type).toBe("SessionCreated")
  })

  it("should handle full session lifecycle: create → busy → add message → completed", async () => {
    // Step 1: Create session
    const createUsecase = new CreateSessionUseCase(sessionRepository, eventBus, logger)
    const createResult = await createUsecase.execute({
      projectPath: "/project",
    })
    expect(createResult.ok).toBe(true)
    const sessionId = createResult.value!.id

    // Step 2: Mark busy (can't add message while busy)
    const markBusyUsecase = new MarkSessionBusyUseCase(sessionRepository, eventBus, logger)
    const busyResult = await markBusyUsecase.execute({ sessionId })
    expect(busyResult.ok).toBe(true)

    // Step 3: Can't add message while busy - should fail
    const addMessageUsecase = new AddMessageToSessionUseCase(sessionRepository, eventBus, logger)
    const messageResult = await addMessageUsecase.execute({
      sessionId,
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    })
    expect(messageResult.ok).toBe(false) // Should fail - session is busy

    // Step 4: Mark completed
    const markCompletedUsecase = new MarkSessionCompletedUseCase(sessionRepository, eventBus, logger)
    const completedResult = await markCompletedUsecase.execute({ sessionId })
    expect(completedResult.ok).toBe(true)

    // Step 5: Can't add message to completed session either
    const messageAfterResult = await addMessageUsecase.execute({
      sessionId,
      role: "user",
      parts: [{ type: "text", text: "After" }],
    })
    expect(messageAfterResult.ok).toBe(false)

    // Verify repository was called correctly
    const calls = sessionRepository.getCallLog()
    expect(calls).toContainEqual(expect.objectContaining({ method: "save" }))
    expect(calls).toContainEqual(expect.objectContaining({ method: "update" }))

    // Verify all events were published
    const events = eventBus.getEvents()
    expect(events.length).toBeGreaterThan(0)
    expect(events).toContainEqual(expect.objectContaining({ type: "SessionCreated" }))
    expect(events).toContainEqual(expect.objectContaining({ type: "SessionStatusChanged", status: "busy" }))
    expect(events).toContainEqual(expect.objectContaining({ type: "SessionCompleted" }))
  })

  it("should fail gracefully when session not found", async () => {
    const addMessageUsecase = new AddMessageToSessionUseCase(sessionRepository, eventBus, logger)

    const result = await addMessageUsecase.execute({
      sessionId: "nonexistent",
      role: "user",
      parts: [{ type: "text", text: "Hello" }],
    })

    expect(result.ok).toBe(false)
    expect(result.error).toBeDefined()

    // Should log error
    const logs = logger.getLogs()
    expect(logs.some((log) => log.level === "error")).toBe(true)
  })

  it("should support parent-child session relationships", async () => {
    const createUsecase = new CreateSessionUseCase(sessionRepository, eventBus, logger)

    // Create parent
    const parentResult = await createUsecase.execute({
      projectPath: "/project",
    })
    expect(parentResult.ok).toBe(true)
    const parentId = parentResult.value!.id

    // Create child
    const childResult = await createUsecase.execute({
      projectPath: "/project",
      parentSessionId: parentId,
    })
    expect(childResult.ok).toBe(true)

    // Child should have reference to parent
    const loadedChild = await sessionRepository.findById(childResult.value!.id as any)
    expect(loadedChild.ok).toBe(true)
    expect(loadedChild.value.parentSessionId).toBe(parentId)
  })
})
