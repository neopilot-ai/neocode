# Application Layer Quick Start

## Setup

### 1. Register Dependencies

At application startup, wire your implementations:

```typescript
// main.ts or bootstrap.ts

import { createContainer } from "@neocode-ai/application"
import { PostgresSessionRepository } from "@neocode-ai/infrastructure/persistence"
import { RabbitMQEventBus } from "@neocode-ai/infrastructure/events"
import { ConsoleLogger } from "@neocode-ai/infrastructure/logging"

const container = createContainer()

// Register implementations (once at startup)
container.register("sessionRepository", new PostgresSessionRepository(dbConnection))
container.register("providerRepository", new PostgresProviderRepository(dbConnection))
container.register("eventBus", new RabbitMQEventBus(rabbitConnection))
container.register("logger", new ConsoleLogger())

// Validate all required services registered
container.validate()

setGlobalContainer(container)
```

### 2. Use Cases in Controllers

```typescript
// controller.ts

import { CreateSessionUseCase, AddMessageToSessionUseCase, LoadProvidersUseCase } from "@neocode-ai/application"
import { getGlobalContainer } from "@neocode-ai/application"

export class SessionController {
  async createSession(body: any) {
    const container = getGlobalContainer()

    const usecase = new CreateSessionUseCase(
      container.getSessionRepository(),
      container.getEventBus(),
      container.getLogger(),
    )

    const result = await usecase.execute({
      projectPath: body.projectPath,
      title: body.title,
    })

    if (!result.ok) {
      return { status: 400, body: { error: result.error.message } }
    }

    return { status: 201, body: result.value }
  }

  async addMessage(sessionId: string, body: any) {
    const container = getGlobalContainer()

    const usecase = new AddMessageToSessionUseCase(
      container.getSessionRepository(),
      container.getEventBus(),
      container.getLogger(),
    )

    const result = await usecase.execute({
      sessionId,
      role: body.role,
      parts: body.parts,
    })

    if (!result.ok) {
      return { status: 400, body: { error: result.error.message } }
    }

    return { status: 200, body: result.value }
  }

  async loadProviders() {
    const container = getGlobalContainer()

    const usecase = new LoadProvidersUseCase(container.getProviderRepository(), container.getLogger())

    const result = await usecase.execute()

    if (!result.ok) {
      return { status: 500, body: { error: result.error.message } }
    }

    return { status: 200, body: result.value }
  }
}
```

## DTOs

### Requests (Input)

```typescript
import type {
  CreateSessionRequest,
  AddMessageRequest,
  MarkSessionBusyRequest,
  MarkSessionCompletedRequest,
  LoadProvidersRequest,
} from "@neocode-ai/application"

// Validate and parse from HTTP/CLI input
const request: CreateSessionRequest = {
  projectPath: "/project/path",
  title: "My Session",
}
```

### Responses (Output)

```typescript
import type { SessionResponse, MessageResponse, ProviderResponse, ModelResponse } from "@neocode-ai/application"

// Return to HTTP/CLI client
const response: SessionResponse = {
  id: "sess_123",
  projectPath: "/project/path",
  title: "My Session",
  status: "idle",
  messageCount: 0,
  createdAt: 1234567890,
  updatedAt: 1234567890,
}
```

## Testing

### Mock Repositories

```typescript
import { describe, it, expect, beforeEach } from "vitest"
import { CreateSessionUseCase } from "@neocode-ai/application"

class MockSessionRepository {
  private sessions = new Map()

  async save(state: any) {
    this.sessions.set(state.id, state)
    return { ok: true, value: state }
  }

  async findById(id: string) {
    const session = this.sessions.get(id)
    return session ? { ok: true, value: session } : { ok: false, error: new Error("Not found") }
  }

  async update(state: any) {
    this.sessions.set(state.id, state)
    return { ok: true, value: state }
  }

  async delete(id: string) {
    this.sessions.delete(id)
    return { ok: true, value: {} }
  }

  async listByProject(projectPath: string) {
    const sessions = Array.from(this.sessions.values()).filter((s) => s.projectPath === projectPath)
    return { ok: true, value: sessions }
  }

  async exists(id: string) {
    return { ok: true, value: this.sessions.has(id) }
  }
}

describe("CreateSessionUseCase", () => {
  it("should create session with idle status", async () => {
    const mockRepo = new MockSessionRepository()
    const mockEventBus = { publish: () => Promise.resolve() }
    const mockLogger = { debug: () => {}, info: () => {}, warn: () => {}, error: () => {} }

    const usecase = new CreateSessionUseCase(mockRepo, mockEventBus as any, mockLogger)

    const result = await usecase.execute({
      projectPath: "/project",
      title: "Test",
    })

    expect(result.ok).toBe(true)
    expect(result.value?.status).toBe("idle")
  })
})
```

## Error Handling

Use cases return `Result<T, Error>` for safe error handling:

```typescript
const result = await usecase.execute(request)

// Type-safe pattern matching
if (!result.ok) {
  // result is Result<T, Error> and result.error is Error
  logger.error("Use case failed", { error: result.error })

  if (result.error.message.includes("not found")) {
    return { status: 404, body: { error: "Session not found" } }
  }

  return { status: 500, body: { error: "Internal server error" } }
}

// result is now Result<T, never> - error branch impossible
const responseData: SessionResponse = result.value
return { status: 200, body: responseData }
```

## Common Patterns

### Command (Modify State)

```typescript
// CreateSessionUseCase, AddMessageUseCase, MarkSessionBusyUseCase
class MyCommandUseCase extends UseCase<RequestDTO, ResponseDTO> {
  async execute(request: RequestDTO): Promise<Result<ResponseDTO, Error>> {
    // 1. Load state (or create new)
    // 2. Modify domain aggregate
    // 3. Save via port
    // 4. Publish event
    // 5. Return response DTO
  }
}
```

### Query (Read State)

```typescript
// LoadProvidersUseCase
class MyQueryUseCase extends QueryUseCase<ResponseDTO> {
  async execute(): Promise<Result<ResponseDTO, Error>> {
    // 1. Read from repository/port
    // 2. Transform to response DTO
    // 3. Return result
  }
}
```

### Error Translation

```typescript
// Domain errors → Application errors
try {
  const session = new Session(state)
  session.addMessage(message) // Throws domain error
} catch (error) {
  // Translate to application error
  if (error instanceof InvalidSessionStateError) {
    return Err(new Error("Cannot add message: session not idle"))
  }
  if (error instanceof ValidationError) {
    return Err(new Error("Invalid message content"))
  }
  // Generic fallback
  return Err(error instanceof Error ? error : new Error(String(error)))
}
```

## Best Practices

1. **One repository per aggregate** - Each use case depends on exactly what it needs
2. **Translate errors** - Don't leak domain/infrastructure errors to presentation
3. **Log important actions** - info level for successful operations, error level for failures
4. **Publish domain events** - Let other services react to changes (event bus subscribers)
5. **Return DTOs** - Never return raw domain entities to callers
6. **Test with mocks** - Mock ports to test orchestration logic
7. **Use Result type** - Avoid exceptions for control flow
8. **Fail-fast validation** - Validate container at startup
