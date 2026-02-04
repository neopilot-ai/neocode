# Phase 2: Domain Extraction - Implementation Guide

This document describes the domain layer extracted in Phase 2 and how to use it.

## What is the Domain Layer?

The **domain layer** contains pure business logic with **zero external dependencies**:

- No HTTP requests
- No file I/O
- No database access
- No infrastructure concerns

It defines:

- **Entities** - Core business objects (Session, Provider, Model)
- **Value Objects** - Immutable concepts (SessionStatus, Message, etc.)
- **Aggregates** - Collections with business rules (Session, Provider)
- **Business Rules** - Validation and state transitions
- **Domain Events** - What happened in the business
- **Errors** - Domain-specific failures

## Session Domain (`src/domain/session`)

### Core Concepts

```typescript
import { Session, SessionFactory, SessionRules } from "@neocode-ai/domain/session"
import type { SessionId, ProjectPath } from "@neocode-ai/shared/types"
import { sessionId, projectPath } from "@neocode-ai/shared/types"

// Create session
const sessionId = sessionId("sess_abc123") as SessionId
const projPath = projectPath("/home/user/project") as ProjectPath

const session = new Session(SessionFactory.create(sessionId, projPath))

// Add message (enforces business rules)
const message = {
  id: "msg_1",
  role: "user",
  parts: [{ type: "text", text: "Hello" }],
  timestamp: Date.now(),
}

session.addMessage(message) // ✅ OK if idle, throws if busy

// Mark as processing
session.markBusy()

// Mark as complete
session.markCompleted()

// Retry logic
session.markRetry("Connection timeout")
```

### Key Business Rules

```typescript
// Check capabilities
SessionRules.canAcceptMessages(status) // Only idle sessions accept messages
SessionRules.isCompleted(status) // Check if done
SessionRules.canRetry(status) // Can retry failed sessions
SessionRules.isDefaultTitle(title) // Auto-generated title?
SessionRules.validateMessage(message) // Valid message format?
```

### Session State Machine

```
┌─────────┐
│  IDLE   │ ← Initial state, can accept messages
└────┬────┘
     │ (start processing)
     ▼
┌─────────┐
│  BUSY   │ ← Processing, cannot accept messages
└────┬────┘
     │ (error occurs)
     ▼
┌─────────┐
│  RETRY  │ ← Failed, will retry (with backoff)
└────┬────┘
     │ (all retries exhausted)
     ▼
┌─────────┐
│ FAILED  │ ← Error, user action required
└─────────┘

     OR

┌─────────┐
│ BUSY    │
└────┬────┘
     │ (success)
     ▼
┌─────────────┐
│ COMPLETED   │ ← Done, archive or share
└─────────────┘
```

## Provider Domain (`src/domain/provider`)

### Core Concepts

```typescript
import { ProviderAggregate, ProviderFactory, ProviderRules } from "@neocode-ai/domain/provider"
import type { ProviderId, ModelId } from "@neocode-ai/shared/types"
import { providerId, modelId } from "@neocode-ai/shared/types"

// Create provider
const provider = ProviderFactory.create(providerId("anthropic") as ProviderId, "anthropic", "Anthropic", {
  type: "api-key",
  requiresSetup: true,
})

// Add model to provider
let provider = ProviderFactory.addModel(provider, {
  id: modelId("claude-3-opus") as ModelId,
  providerId: "anthropic",
  name: "claude-3-opus",
  displayName: "Claude 3 Opus",
  capabilities: {
    reasoning: true,
    streaming: true,
    vision: true,
    audio: false,
    videoInput: false,
    pdfInput: true,
    toolCalling: true,
  },
  contextWindow: 200000,
  cost: { input: 0.015, output: 0.075 },
})

// Check capabilities
const hasVision = ProviderRules.supportsCapability(model, "vision")
const canUse = ProviderRules.isAvailable(provider)

// Find best model for vision
const bestVisionModel = ProviderRules.findBestModel(provider, "vision")
```

### Business Rules

```typescript
// Capabilities
ProviderRules.supportsCapability(model, "vision")
ProviderRules.filterByCapability(models, "reasoning")

// Availability
ProviderRules.isAvailable(provider) // Enabled + has models?
ProviderRules.requiresAuth(provider) // Needs API key?
ProviderRules.isValidCost(cost) // Valid pricing?

// Selection
ProviderRules.findBestModel(provider, "vision") // Newest, capability-aware
```

## Ports (Interfaces)

Ports define the contracts between domain and infrastructure:

```typescript
import type { ISessionRepository, IProviderRepository } from "@neocode-ai/ports"
import type { IEventBus } from "@neocode-ai/ports"
import type { ILogger } from "@neocode-ai/ports"

// Repositories (persistence)
interface ISessionRepository {
  findById(id: SessionId): Promise<Result<Session>>
  save(session: Session): Promise<Result<void>>
  update(session: Session): Promise<Result<void>>
  delete(id: SessionId): Promise<Result<void>>
  listByProject(projectPath: string): Promise<Result<SessionId[]>>
  exists(id: SessionId): Promise<Result<boolean>>
}

// Event bus
interface IEventBus {
  publish(event: DomainEvent): Promise<void>
  subscribe(handler: IEventHandler): void
}

// Logger
interface ILogger {
  debug(msg: string, metadata?: Record<string, unknown>): void
  info(msg: string, metadata?: Record<string, unknown>): void
  warn(msg: string, metadata?: Record<string, unknown>): void
  error(msg: string, error?: Error, metadata?: Record<string, unknown>): void
}
```

## Type Safety

### Branded Types

Use branded types to prevent accidental ID mixing:

```typescript
import type { SessionId, ModelId, ProviderId } from "@neocode-ai/shared/types"
import { sessionId, modelId, providerId } from "@neocode-ai/shared/types"

const sid = sessionId("abc") as SessionId
const mid = modelId("abc") as ModelId

// Compiler catches this:
const session = getSession(mid) // ❌ Error: ModelId !== SessionId
```

### Result Type

Use `Result<T, E>` for error handling:

```typescript
import type { Result } from "@neocode-ai/shared/types"
import { Ok, Err, isOk, mapOk } from "@neocode-ai/shared/types"

// Return results
function loadProvider(id: ProviderId): Promise<Result<Provider>> {
  try {
    const provider = await repo.findById(id)
    return Ok(provider)
  } catch (error) {
    return Err(new ProviderNotFoundError(id))
  }
}

// Consume results
const result = await loadProvider(id)
if (isOk(result)) {
  console.log(result.value.name) // ✅ Type-safe
} else {
  console.error(result.error.message)
}
```

## Testing

Tests are in `tests/unit/domain/`:

```bash
# Run domain tests
bun test tests/unit/domain/

# Run specific test
bun test tests/unit/domain/session.test.ts
```

### Writing Domain Tests

Domain tests verify business rules in isolation:

```typescript
import { describe, it, expect } from "vitest"
import { Session, SessionFactory } from "@neocode-ai/domain/session"
import { sessionId, projectPath } from "@neocode-ai/shared/types"

describe("Session Domain", () => {
  it("should not accept messages when busy", () => {
    const session = new Session(
      SessionFactory.create(sessionId("sess_123") as SessionId, projectPath("/project") as ProjectPath),
    )

    session.markBusy()

    expect(() => {
      session.addMessage(message)
    }).toThrow(InvalidSessionStateError)
  })
})
```

## Next Steps

### When Phase 2 is Done

✅ Domain entities with business rules  
✅ Type-safe IDs and error handling  
✅ Port interfaces for infrastructure  
✅ Unit tests for domain logic

### What's Next (Phase 3)

The **Application Layer** will:

1. Create use cases (orchestrate domain + ports)
2. Build the dependency injection container
3. Wire up domain → application → infrastructure
4. Create integration tests

Example use case:

```typescript
// application/session/create-session.ts

export class CreateSessionUseCase {
  constructor(
    private sessionRepository: ISessionRepository,
    private eventBus: IEventBus,
    private logger: ILogger,
  ) {}

  async execute(projectPath: ProjectPath): Promise<Result<SessionId>> {
    const session = new Session(SessionFactory.create(generateId(), projectPath))

    await this.sessionRepository.save(session)
    await this.eventBus.publish({
      type: "session.created",
      sessionId: session.getState().id,
      projectPath,
      timestamp: Date.now(),
    })

    this.logger.info("Session created", { sessionId: session.getState().id })
    return Ok(session.getState().id)
  }
}
```

## File Organization

```
domain/
├── session/
│   ├── types.ts          # Entities, value objects, rules
│   ├── aggregate.ts      # Aggregate root (Session class)
│   ├── events.ts         # Domain events
│   └── mod.ts            # Public API
│
├── provider/
│   ├── types.ts
│   ├── aggregate.ts
│   ├── events.ts
│   └── mod.ts
│
└── project/
    ├── types.ts
    ├── aggregate.ts
    ├── events.ts
    └── mod.ts

ports/
├── persistence.ts        # Repository interfaces
├── event-bus.ts          # Event publishing
├── logger.ts             # Logging
└── mod.ts                # Public API

tests/unit/domain/
├── session.test.ts       # Session domain tests
└── provider.test.ts      # Provider domain tests
```

## Key Principles

1. **No Infrastructure** - Domain knows nothing about HTTP, files, databases
2. **Immutable State** - Aggregates use factory methods for state changes
3. **Type Safety** - Branded types and Result<T,E> throughout
4. **Business Rules** - All logic centralizedRules classes
5. **Testable** - Unit tests with zero mocking, pure functions
6. **Events** - Domain changes emit events for notification

## Common Mistakes to Avoid

❌ **Domain importing from infrastructure**

```typescript
// WRONG
import { fileStorage } from "@/infrastructure/file-storage" // No!
```

✅ **Domain defining interfaces, infrastructure implementing**

```typescript
// RIGHT
import type { ISessionRepository } from "@/ports" // Just the interface
```

❌ **I/O in domain**

```typescript
// WRONG
export const loadSession = async (id: SessionId) => {
  const file = await Bun.file(`/sessions/${id}`).json() // No!
  return file
}
```

✅ **Injected dependencies**

```typescript
// RIGHT
export class CreateSessionUseCase {
  constructor(private repository: ISessionRepository) {} // Injected
}
```

---

**Phase 2 is now complete!** Domain layer is ready for use in application and integration tests.
