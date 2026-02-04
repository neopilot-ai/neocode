# Public API Reference

This document describes all public APIs exported from the refactored neocode architecture.

## Domain Layer

### Session Domain

```typescript
// Create and manage sessions
import { Session, SessionFactory, SessionRules } from "@neocode-ai/domain/session"
import type {
  SessionAggregateRoot,
  SessionStatus,
  Message,
  MessagePart,
  SessionDomainEvent,
} from "@neocode-ai/domain/session"

// Example
const state = SessionFactory.create(sessionId, projectPath, title)
const session = new Session(state)
session.addMessage(message) // Throws if invalid state

// SessionStatus: 'idle' | 'busy' | 'retry' | 'completed' | 'failed'
// SessionDomainEvent: SessionCreatedEvent | MessageAddedEvent | ...
```

### Provider Domain

```typescript
// Create and manage providers
import { ProviderAggregate, ProviderFactory, ProviderRules } from "@neocode-ai/domain/provider"
import type { Provider, Model, ModelCapabilities, ProviderDomainEvent } from "@neocode-ai/domain/provider"

// Example
const state = ProviderFactory.create(providerId, name)
const provider = new ProviderAggregate(state)
provider.addModel(model)
```

## Port Interfaces

### Persistence

```typescript
import type { ISessionRepository, IProviderRepository } from '@neocode-ai/ports/persistence'

// Sessions
repository.findById(sessionId): Promise<Result<SessionAggregateRoot>>
repository.save(state): Promise<Result<SessionAggregateRoot>>
repository.update(state): Promise<Result<SessionAggregateRoot>>
repository.delete(sessionId): Promise<Result<void>>
repository.listByProject(projectPath): Promise<Result<SessionAggregateRoot[]>>
repository.exists(sessionId): Promise<Result<boolean>>

// Providers
repository.findById(providerId): Promise<Result<Provider>>
repository.listAll(): Promise<Result<Provider[]>>
repository.save(provider): Promise<Result<Provider>>
repository.update(provider): Promise<Result<Provider>>
repository.exists(providerId): Promise<Result<boolean>>
```

### Event Bus

```typescript
import type { IEventBus, IEventHandler, DomainEvent } from '@neocode-ai/ports/event-bus'

// Publish domain events
eventBus.publish(event): Promise<void>

// Subscribe to events
eventBus.subscribe(eventType, handler): Promise<void>
eventBus.unsubscribe(eventType): Promise<void>

// Handle events
handler.handle(event): Promise<void>
```

### Logging

```typescript
import type { ILogger, LogLevel } from '@neocode-ai/ports/logger'

logger.debug(message, data?)
logger.info(message, data?)
logger.warn(message, data?)
logger.error(message, data?)

// LogLevel: 'debug' | 'info' | 'warn' | 'error'
```

## Application Layer

### Use Cases

```typescript
import {
  CreateSessionUseCase,
  AddMessageToSessionUseCase,
  MarkSessionBusyUseCase,
  MarkSessionCompletedUseCase,
  LoadProvidersUseCase
} from '@neocode-ai/application'

// All use cases return Promise<Result<ResponseDTO, Error>>

// Create session
const usecase = new CreateSessionUseCase(repo, eventBus, logger)
const result = await usecase.execute({
  projectPath: string,
  title?: string
})

// Add message to session
const result = await usecase.execute({
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  parts: MessagePartDTO[]
})

// Mark session as busy (processing)
const result = await usecase.execute({
  sessionId: string
})

// Mark session as completed
const result = await usecase.execute({
  sessionId: string
})

// Load all providers
const result = await usecase.execute()  // No parameters
```

### DTOs

```typescript
import type {
  CreateSessionRequest,
  SessionResponse,
  AddMessageRequest,
  MessagePartDTO,
  MessageResponse,
  LoadProvidersRequest,
  ProviderResponse,
  ModelResponse,
} from "@neocode-ai/application"

// Request DTOs
type CreateSessionRequest = {
  projectPath: string
  title?: string
  parentSessionId?: string
}

type AddMessageRequest = {
  sessionId: string
  role: "user" | "assistant" | "system"
  parts: MessagePartDTO[]
}

// Response DTOs
type SessionResponse = {
  id: string
  projectPath: string
  title: string
  status: string
  messageCount: number
  createdAt: number
  updatedAt: number
}

type ProviderResponse = {
  id: string
  name: string
  displayName: string
  isCustom: boolean
  isEnabled: boolean
  modelCount: number
}
```

### Dependency Injection

```typescript
import { Container, createContainer, getGlobalContainer, setGlobalContainer } from "@neocode-ai/application"

// Create container
const container = createContainer()

// Register services
container.register("sessionRepository", implementation)
container.register("providerRepository", implementation)
container.register("eventBus", implementation)
container.register("logger", implementation)

// Validate all required
container.validate() // Throws if missing

// Set globally
setGlobalContainer(container)

// Use anywhere
const container = getGlobalContainer()
const repo = container.getSessionRepository()
```

## Presentation Layer

### CLI Handlers

```typescript
import {
  CommandHandler,
  CreateSessionCommand,
  AddMessageCommand,
  ListProvidersCommand
} from '@neocode-ai/presentation'

// Base class for custom commands
abstract class CommandHandler {
  constructor(container: Container)
  protected printError(error: Error | string)
  protected printSuccess(message: string)
  protected printInfo(message: string)
  abstract execute(...args: any[]): Promise<void>
}

// Usage
const command = new CreateSessionCommand(container)
await command.execute({
  project: string,
  title?: string
})
```

### HTTP Handlers

```typescript
import { RouteHandler, CreateSessionHandler, AddMessageHandler, LoadProvidersHandler } from "@neocode-ai/presentation"

// Base class for custom handlers
abstract class RouteHandler {
  constructor(container: Container)
  protected success<T>(res, data, statusCode?)
  protected error(res, error, statusCode?)
  protected validateRequired(body, fields)
  abstract handle(req: Request, res: Response): Promise<void>
}

// Usage
const handler = new CreateSessionHandler(container)
await handler.handle(req, res)
```

### TUI Handlers

```typescript
import { TuiHandler, CreateSessionTuiHandler, LoadProvidersTuiHandler } from "@neocode-ai/presentation"

// Base class for custom handlers
abstract class TuiHandler {
  constructor(container: Container)
  protected showToast(message, type)
  protected getSessionRepository()
  protected getProviderRepository()
  protected getEventBus()
  protected getLogger()
  abstract execute(...args: any[]): Promise<any>
}

// Usage
const handler = new CreateSessionTuiHandler(container)
const result = await handler.execute({ projectPath: string })
```

## Shared Utilities

### Result Type

```typescript
import { Ok, Err, type Result } from "@neocode-ai/shared/types/result"

// Type-safe error handling
type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

// Create results
const success = Ok(value)
const failure = Err(error)

// Pattern match
const result = await operation()
if (result.ok) {
  console.log(result.value) // T type
} else {
  console.log(result.error) // E type
}

// Utilities
result.mapOk((val) => transform(val))
result.mapErr((err) => handle(err))
result.flatMap((val) => otherResult)
result.getOrThrow()
result.getOrDefault(defaultValue)
```

### Branded Types

```typescript
import type { SessionId, ModelId, ProviderId, UserId } from "@neocode-ai/shared/types/branded"

// Type-safe IDs that prevent mixing
type SessionId = Brand<string, "SessionId">
type ModelId = Brand<string, "ModelId">

// Create branded IDs
const id = sessionId("sess_123") as SessionId

// Can't mix types (compile error)
aggregate.setModelId(sessionId("...")) // ❌ Type error
```

### Utilities

```typescript
import { pipe, compose, memoize, debounce, throttle, sleep, retry } from "@neocode-ai/shared/utils"

// Function composition
const result = pipe(value, transform1, transform2, transform3)

// Memoization
const expensiveFn = memoize((x) => compute(x))

// Debounce
const handler = debounce(() => save(), 500)

// Retry logic
const result = await retry(() => operation(), { times: 3 })
```

### Error Types

```typescript
import {
  NamedError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from "@neocode-ai/shared/errors"

// Base error with name
throw new NamedError("CustomError", "message")

// Validation errors
throw new ValidationError("field", "Invalid value")

// Not found
throw new NotFoundError("Session", sessionId)

// Authorization errors
throw new UnauthorizedError("message")
throw new ForbiddenError("message")

// Conflict
throw new ConflictError("resource", "conflicting condition")
```

## Examples

### Full Workflow: CLI

```typescript
import { getGlobalContainer } from "@neocode-ai/application"
import { CreateSessionCommand } from "@neocode-ai/presentation"

const container = getGlobalContainer()
const command = new CreateSessionCommand(container)

await command.execute({
  project: "/my/project",
  title: "Debug Session",
})

// Output:
// ✅ Session created: sess_abc123
// { "id": "sess_abc123", ... }
```

### Full Workflow: HTTP

```typescript
import { CreateSessionHandler } from "@neocode-ai/presentation"

const handler = new CreateSessionHandler(container)

await handler.handle(req, res)

// Input:  POST /api/sessions { projectPath: "...", title: "..." }
// Output: 201 Created { "ok": true, "data": { "id": "...", ... } }
```

### Full Workflow: TUI (Solid.js)

```tsx
import { CreateSessionTuiHandler } from "@neocode-ai/presentation"
import { createResource, Show } from "solid-js"

export function CreateSessionDialog() {
  const handler = new CreateSessionTuiHandler(container)

  const [session] = createResource(
    () => ({ projectPath: "/project" }),
    (p) => handler.execute(p),
  )

  return (
    <Show when={session()} fallback={<Loading />}>
      <div>Created: {session().id}</div>
    </Show>
  )
}
```

## Import Paths

```typescript
// Domain
import { ... } from '@neocode-ai/domain/session'
import { ... } from '@neocode-ai/domain/provider'

// Ports
import { ... } from '@neocode-ai/ports/persistence'
import { ... } from '@neocode-ai/ports/event-bus'
import { ... } from '@neocode-ai/ports/logger'

// Application
import { ... } from '@neocode-ai/application'

// Presentation
import { ... } from '@neocode-ai/presentation'

// Shared
import { ... } from '@neocode-ai/shared/types/result'
import { ... } from '@neocode-ai/shared/types/branded'
import { ... } from '@neocode-ai/shared/utils'
import { ... } from '@neocode-ai/shared/errors'
```

## Path Aliases

All imports use path aliases defined in root `tsconfig.json`:

```
@neocode-ai/domain/*           → packages/neocode/src/domain/*
@neocode-ai/ports/*            → packages/neocode/src/ports/*
@neocode-ai/application/*       → packages/neocode/src/application/*
@neocode-ai/presentation/*      → packages/neocode/src/presentation/*
@neocode-ai/shared/*           → packages/neocode/src/shared/*
@neocode-ai/infrastructure/*    → packages/neocode/src/infrastructure/*
```
