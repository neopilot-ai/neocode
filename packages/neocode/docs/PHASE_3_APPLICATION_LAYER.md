# Phase 3: Application Layer

## Overview

The Application Layer is the **orchestration layer** that sits between the Presentation Layer (CLI, Web, Server, TUI) and the Domain Layer. It coordinates:

- **Presentation ← Application ← Domain**
- **Application ← Infrastructure (via Ports)**

Use Cases receive DTOs from controllers, orchestrate domain logic, persist via ports, and return DTOs to callers.

## Key Concepts

### 1. Use Cases (Application Services)

Use cases represent **high-level operations** that users want to perform. Each use case:

1. **Takes a DTO** (Data Transfer Object) as input
2. **Orchestrates** domain + ports (repositories, event bus, logger)
3. **Returns a Result** with response DTO or error
4. **Never contains business logic** (logic lives in domain)

```typescript
// Pattern: Use case orchestrates domain + ports

class CreateSessionUseCase extends UseCase<CreateSessionRequest, SessionResponse> {
  constructor(
    private sessionRepository: ISessionRepository,
    private eventBus: IEventBus,
    private logger: ILogger
  ) {
    super()
  }

  async execute(request: CreateSessionRequest): Promise<Result<SessionResponse, Error>> {
    // 1. Create domain aggregate (factory ensures valid state)
    const state = SessionFactory.create(...)

    // 2. Persist via port (dependency injection)
    const saveResult = await this.sessionRepository.save(state)

    // 3. Publish event via port
    await this.eventBus.publish(SessionCreatedEvent)

    // 4. Return DTO (translate domain to presentation)
    return Ok({ ...state, messageCount: 0 })
  }
}
```

**Benefits:**

- Use cases are **testable** (mock ports, verify calls)
- Use cases are **reusable** (same use case for CLI, Web, Server, TUI)
- Presentation doesn't depend on infrastructure
- Domain remains pure (no I/O)

### 2. DTOs (Data Transfer Objects)

DTOs define the **contract** between layers:

- **Input DTO:** Request type (from controller/CLI)
- **Output DTO:** Response type (to controller/view)
- DTOs are **different** from domain entities (flatten nested data, add computed fields)

```typescript
// Domain aggregate (internal)
type SessionAggregateRoot = {
  id: SessionId
  projectPath: string
  title: string
  status: SessionStatus // 'idle' | 'busy' | 'completed' | 'failed'
  messages: Message[]
  createdAt: number
  updatedAt: number
}

// Application DTO (external contract)
type SessionResponse = {
  id: string // Not branded type
  projectPath: string
  title: string
  status: string // String, not enum
  messageCount: number // Computed (not in aggregate)
  createdAt: number
  updatedAt: number
}
```

**Why separate?**

- Domain entities enforce invariants
- DTOs are presentation-friendly (serializable, flat)
- Can change domain without breaking APIs
- Can add computed fields without domain bloat

### 3. Dependency Injection Container

The Container manages service lifecycle:

```typescript
const container = new Container()

// Register (wire dependencies at startup)
container.register("sessionRepository", new PostgresSessionRepository())
container.register("eventBus", new RabbitMQEventBus())
container.register("logger", new ConsoleLogger())

// Resolve (use in use cases)
const sessionRepo = container.getSessionRepository()
const createSession = new CreateSessionUseCase(sessionRepo, eventBus, logger)
```

**Benefits:**

- Single point to configure services
- Easy to swap implementations (e.g., mock repository in tests)
- Type-safe dependency resolution
- Fail-fast if dependencies are missing

## Use Case Examples

### Example 1: CreateSessionUseCase

```
User Request: Create new session
├─ Input: CreateSessionRequest (projectPath, title?)
├─ Orchestration:
│  ├─ Create domain aggregate (SessionFactory.create)
│  ├─ Save to repository (ISessionRepository.save)
│  ├─ Publish event (IEventBus.publish SessionCreatedEvent)
│  └─ Log action (ILogger.info)
└─ Output: SessionResponse (id, status=idle, messageCount=0, ...)
```

### Example 2: AddMessageToSessionUseCase

```
User Request: Add message to session
├─ Input: AddMessageRequest (sessionId, role, parts[])
├─ Orchestration:
│  ├─ Load session from repository (ISessionRepository.findById)
│  ├─ Add message to aggregate (Session.addMessage)
│  │  └─ Domain enforces: status must be idle
│  │  └─ Domain validates: message content required, valid role, etc.
│  ├─ Save updated session (ISessionRepository.update)
│  ├─ Publish event (IEventBus.publish SessionMessageAddedEvent)
│  └─ Log action (ILogger.info)
└─ Output: MessageResponse (id, role, parts[], timestamp)
```

**Domain validation happens in aggregate, not use case:**

```typescript
// Domain enforces this (not use case responsibility)
session.addMessage(message) // Throws if status != idle
// Throws if message invalid
```

### Example 3: LoadProvidersUseCase (Query)

Queries don't modify state, just fetch and return. Use `QueryUseCase` base:

```
User Request: Load all providers
├─ Input: None (Query)
├─ Orchestration:
│  ├─ Fetch from repository (IProviderRepository.listAll)
│  └─ Log action (ILogger.info)
└─ Output: ProviderResponse[] (id, name, displayName, enabled, modelCount)
```

## Layer Architecture

```
┌─────────────────────────────────────┐
│    Presentation Layer               │  Controllers, CLI handlers, Server routes
│  - CLI commands                     │  HTTP endpoints, TUI widgets
│  - HTTP endpoints                   │
│  - TUI event handlers               │
└─────────┬───────────────────────────┘
          │ uses
          ↓
┌─────────────────────────────────────┐
│    Application Layer (NEW)          │  Use case orchestration
│  - Use cases                        │  DTO translation
│  - Dependency injection             │  Cross-cutting concerns
│  - Error handling                   │
└─────────┬───────────────────────────┘
          │ orchestrates       calls
          ↓                    ↓
┌──────────────────┐    ┌───────────────────────────────────┐
│ Domain Layer     │    │  Infrastructure Layer (via Ports) │
│                  │    │                                   │
│- Aggregates      │    │- ISessionRepository               │
│- Value Objects   │    │  (PostgreSQL, SQLite, Memory)     │
│- Rules           │    │- IEventBus                        │
│- Events          │    │  (RabbitMQ, Redis, In-Memory)     │
│(0% I/O, 100%     │    │- ILogger                          │
│ pure functions)  │    │  (Console, File, Datadog, etc)    │
└──────────────────┘    └───────────────────────────────────┘

KEY RULE: Domain ← Application ← Infrastructure (never reverse)
```

## Design Patterns

### 1. Command vs Query Pattern

```typescript
// Command: Modifies state, returns result (or void)
class CreateSessionUseCase extends UseCase<CreateSessionRequest, SessionResponse> {
  async execute(request) { ... }  // Creates session
}

// Query: Reads state, no side effects
class LoadProvidersUseCase extends QueryUseCase<ProviderResponse[]> {
  async execute() { ... }  // Just reads
}
```

### 2. Result Type for Error Handling

```typescript
// Use Result<T, E> instead of exceptions (domain-style)
const result = await usecase.execute(request)

if (!result.ok) {
  // Handle error (result.error)
  return { status: 400, body: result.error.message }
}

// Use value (result.value)
return { status: 200, body: result.value }
```

Benefits:

- Type-safe error handling
- No uncaught exceptions leak to presentation
- Composable error chains (map, flatMap, etc.)

### 3. DTO Translation at Boundaries

```typescript
// Input boundary: Controller receives raw data, converts to DTO
@Post('/sessions')
async create(body: any) {
  const request: CreateSessionRequest = {
    projectPath: body.projectPath,
    title: body.title
  }
  const result = await usecase.execute(request)
  if (!result.ok) return error(result.error)
  return success(result.value)  // DTO returned to client
}

// Output boundary: Use case returns DTO, controller serializes
// No domain types leak through HTTP/gRPC/GraphQL boundary
```

## Testing Strategy

### Unit Tests (Domain)

```
Domain tests verify **business rules** in isolation
- No I/O
- No mocking (all pure functions)
- Test aggregates, value objects, rules directly
```

### Integration Tests (Application)

```
Integration tests verify **orchestration** with mocks
- Mock repositories, event bus, logger
- Verify correct port calls in correct order
- Test error cases (not found, etc.)
- Test end-to-end workflows
```

### Example Integration Test:

```typescript
it("should create session, add message, mark completed", async () => {
  // Setup mocks
  const mockRepo = new MockSessionRepository()
  const mockBus = new MockEventBus()

  // Create use case with dependencies
  const createUsecase = new CreateSessionUseCase(mockRepo, mockBus, logger)
  const addMessageUsecase = new AddMessageToSessionUseCase(mockRepo, mockBus, logger)

  // Execute workflow
  const createResult = await createUsecase.execute({ projectPath: "/project" })
  const sessionId = createResult.value!.id

  const addResult = await addMessageUsecase.execute({
    sessionId,
    role: "user",
    parts: [{ type: "text", text: "Hello" }],
  })

  // Verify calls were made
  expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({ id: sessionId }))
  expect(mockBus.publish).toHaveBeenCalledWith(expect.objectContaining({ type: "SessionCreated" }))
})
```

## File Organization

```
src/application/
├── usecase.ts          # Base class for use cases
├── dto.ts              # All DTOs (input & output)
├── usecases/           # Concrete use case implementations
│   ├── create-session.ts
│   ├── add-message.ts
│   ├── mark-busy.ts
│   ├── mark-completed.ts
│   └── load-providers.ts
├── di/
│   ├── container.ts    # Dependency injection container
│   └── mod.ts          # Public API
└── mod.ts              # Public API (exports all)

tests/integration/
├── session-workflow.test.ts  # Session use case workflows
└── provider-query.test.ts    # Provider queries
```

## Common Mistakes to Avoid

### ❌ Mistake 1: Business Logic in Use Cases

```typescript
// WRONG - Logic belongs in domain
class CreateSessionUseCase {
  async execute(request) {
    if (request.title.length > 100) {  // ❌ Business rule in use case
      throw new Error('Title too long')
    }
    // ...
  }
}

// RIGHT - Logic in domain factory
const state = SessionFactory.create(..., title)  // ✅ Factory validates
```

### ❌ Mistake 2: Domain Types Leaking Through API

```typescript
// WRONG
interface SessionResponse {
  id: SessionId // ❌ Branded type in API response
  status: SessionStatus // ❌ Enum in API (not serializable everywhere)
}

// RIGHT
interface SessionResponse {
  id: string // ✅ Plain string
  status: "idle" | "busy" | "completed" // ✅ Literal type (serializable)
}
```

### ❌ Mistake 3: Too Many Dependencies

```typescript
// WRONG - Use case depends on too much
class CreateSessionUseCase {
  constructor(
    repo1,
    repo2,
    repo3,
    repo4, // Too many!
    eventBus1,
    eventBus2,
    logger,
    cache,
    analytics,
    metrics,
  ) {}
}

// RIGHT - Single responsibility
class CreateSessionUseCase {
  constructor(
    private sessionRepository: ISessionRepository,
    private eventBus: IEventBus,
    private logger: ILogger,
  ) {}
}
```

### ❌ Mistake 4: Directly Using Port Errors

```typescript
// WRONG
const result = await repo.save(entity)
if (!result.ok) {
  // Use case leaks repository errors to presentation
  return Err(result.error)
}

// RIGHT - Translate errors to application-level errors
const result = await repo.save(entity)
if (!result.ok) {
  this.logger.error("Failed to save", { error: result.error })
  return Err(new Error("Failed to create session")) // ✅ Application error
}
```

## Next Steps (Phase 4)

Phase 3 establishes the orchestration layer. Next:

- **Phase 4: Presentation Layer**
  - Move CLI commands to `presentation/cli/commands/`
  - Move HTTP routes to `presentation/server/routes/`
  - Move TUI to `presentation/tui/`
  - All call use cases through dependency injection
  - Remove direct domain imports from presentation

## Summary

| Aspect      | Phase 2: Domain           | Phase 3: Application     | Phase 4: Presentation     |
| ----------- | ------------------------- | ------------------------ | ------------------------- |
| **Owns**    | Business rules            | Orchestration            | User interface            |
| **Has**     | Aggregates, rules, events | Use cases, DTOs, DI      | Controllers, handlers     |
| **Imports** | Nothing (pure)            | Domain + Ports           | Application               |
| **Tests**   | Unit (no mocking)         | Integration (mock ports) | E2E/acceptance            |
| **Example** | `Session.addMessage()`    | `CreateSessionUseCase`   | `POST /sessions` endpoint |

Phase 3 is complete when:

- ✅ All use cases defined and tested
- ✅ DTOs separate from domain entities
- ✅ Container wires all dependencies
- ✅ Integration tests pass
- ✅ Presentation layer can consume use cases cleanly
