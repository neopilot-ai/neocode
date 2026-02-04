# Phase 4: Presentation Layer

## Overview

The Presentation Layer is the **user interface layer** that adapts external interfaces (HTTP, CLI, TUI) to use the Application Layer. It translates between:

- **User Input → DTO → Use Case**
- **Use Case Result → Response DTO → User Output**

Presentation handlers are thin adapters—no business logic, just translation and user feedback.

## Architecture

```
User Interfaces (CLI, HTTP, TUI, GraphQL)
         ↓
Presentation Layer (NEW - Phase 4)
├─ CLI Handlers
├─ HTTP Handlers
└─ TUI Handlers
         ↓
Application Layer (Use Cases)
         ↓
Domain Layer (Business Rules)
```

## Layer Separation

### ✅ Presentation Can Do

- Accept user input (CLI args, HTTP body, TUI events)
- Call use cases through container
- Format output (JSON, tables, toast notifications)
- Handle HTTP status codes
- Show user-friendly error messages

### ❌ Presentation Must NOT Do

- Import domain entities directly
- Contain business logic (validation, state management)
- Access infrastructure (database, API) directly
- Know how repositories work internally
- Import infrastructure implementations

## CLI Commands

CLI handlers extend `CommandHandler` base class:

```typescript
// src/presentation/cli/commands/create-session.ts
export class CreateSessionCommand extends CommandHandler {
  async execute(options: { project: string; title?: string }): Promise<void> {
    const usecase = new CreateSessionUseCase(
      this.container.getSessionRepository(),
      this.container.getEventBus(),
      this.container.getLogger(),
    )

    const result = await usecase.execute({
      projectPath: options.project,
      title: options.title,
    })

    if (!result.ok) {
      this.printError(result.error)
      process.exit(1)
    }

    this.printSuccess(`Session created: ${result.value.id}`)
  }
}
```

**Usage from CLI bootstrap:**

```typescript
// cli/bootstrap.ts or similar
import { CreateSessionCommand } from "@neocode-ai/presentation"
import { getGlobalContainer } from "@neocode-ai/application"

async function handleCreateSession(options: any) {
  const command = new CreateSessionCommand(getGlobalContainer())
  await command.execute(options)
}
```

## HTTP Handlers

HTTP handlers extend `RouteHandler` base class:

```typescript
// src/presentation/server/handlers/create-session.ts
export class CreateSessionHandler extends RouteHandler {
  async handle(req: Request, res: Response): Promise<void> {
    const validation = this.validateRequired(req.body, ["projectPath"])
    if (validation) {
      return this.error(res, validation)
    }

    const usecase = new CreateSessionUseCase(
      this.container.getSessionRepository(),
      this.container.getEventBus(),
      this.container.getLogger(),
    )

    const result = await usecase.execute({
      projectPath: req.body.projectPath,
      title: req.body.title,
    })

    if (!result.ok) {
      return this.error(res, result.error)
    }

    this.success(res, result.value, 201)
  }
}
```

**Usage from Express router:**

```typescript
// server/routes/session.ts (refactored to use handlers)
import { Router } from "express"
import { CreateSessionHandler } from "@neocode-ai/presentation"
import { getGlobalContainer } from "@neocode-ai/application"

const router = Router()

router.post("/sessions", async (req, res) => {
  const handler = new CreateSessionHandler(getGlobalContainer())
  await handler.handle(req, res)
})

export default router
```

## TUI Handlers

TUI handlers extend `TuiHandler` base class for Solid.js components:

```typescript
// src/presentation/tui/create-session.ts
export class CreateSessionTuiHandler extends TuiHandler {
  async execute(request: CreateSessionRequest): Promise<any> {
    const usecase = new CreateSessionUseCase(this.getSessionRepository(), this.getEventBus(), this.getLogger())

    const result = await usecase.execute(request)

    if (!result.ok) {
      throw result.error
    }

    this.showToast(`Session created: ${result.value.id}`, "success")
    return result.value
  }
}
```

**Usage from TUI component (Solid.js):**

```typescript
// cli/cmd/tui/routes/session/create-dialog.tsx (refactored)
import { createResource } from 'solid-js'
import { CreateSessionTuiHandler } from '@neocode-ai/presentation'
import { useSDK } from './context/sdk'  // Gets container somehow

export function CreateSessionDialog() {
  const handler = new CreateSessionTuiHandler(getContainer())

  const [session] = createResource(
    () => ({ projectPath: '/my/project', title: 'New Session' }),
    (params) => handler.execute(params)
  )

  return (
    <Show when={session()} fallback={<Spinner />}>
      <div>{session().title}</div>
    </Show>
  )
}
```

## Error Handling Pattern

All handlers follow the same error pattern:

```typescript
// CLI
if (!result.ok) {
  this.printError(result.error) // User sees: ❌ Error: message
  process.exit(1)
}

// HTTP
if (!result.ok) {
  return this.error(res, result.error, 400) // Returns: { ok: false, error: "message" }
}

// TUI
if (!result.ok) {
  throw result.error // Solid.js catches and shows fallback/error state
}
```

## File Organization

```
src/presentation/
├── cli/
│   ├── command-handler.ts      # Base class for CLI commands
│   ├── commands/               # Concrete command implementations
│   │   ├── create-session.ts
│   │   ├── add-message.ts
│   │   └── list-providers.ts
│   └── mod.ts                  # Public API
├── server/
│   ├── route-handler.ts        # Base class for HTTP handlers
│   ├── handlers/               # Concrete handler implementations
│   │   ├── create-session.ts
│   │   ├── add-message.ts
│   │   └── load-providers.ts
│   └── mod.ts                  # Public API (if separate)
├── tui/
│   ├── tui-handler.ts          # Base class for TUI handlers
│   ├── create-session.ts       # TUI handler implementations
│   ├── load-providers.ts
│   └── mod.ts                  # Public API (if separate)
└── mod.ts                      # Public API (all exports)
```

## Layer Dependencies

```
// ✅ ALLOWED (Correct flow)
CLI Command → Application Layer (Use Case) → Domain Layer
CLI Command → Application Layer (Use Case) → Ports (interfaces)

// ❌ FORBIDDEN (Violates architecture)
CLI Command → Domain Layer directly
CLI Command → Infrastructure Layer directly
CLI Command → Internal domain types (Session, SessionId, etc.)
```

## Import Examples

### ✅ Good Imports in Presentation

```typescript
// ✅ Import application types (DTOs, use cases)
import { CreateSessionUseCase, type CreateSessionRequest, type SessionResponse } from "@neocode-ai/application"

// ✅ Import shared utilities
import { type Result } from "@neocode-ai/shared/types/result"

// ✅ Import presentation base classes
import { CommandHandler } from "./command-handler"
```

### ❌ Bad Imports in Presentation

```typescript
// ❌ Don't import domain aggregates
import { Session } from "@neocode-ai/domain/session" // WRONG!

// ❌ Don't import domain value objects
import type { SessionId } from "@neocode-ai/domain/session" // WRONG!

// ❌ Don't import infrastructure
import { PostgresSessionRepository } from "@neocode-ai/infrastructure" // WRONG!

// ❌ Don't import internal port interfaces
import type { ISessionRepository } from "@neocode-ai/ports" // WRONG (use through container)
```

## Common Patterns

### CLI Command with Options

```typescript
export class MyCommand extends CommandHandler {
  async execute(options: { flag1: string; flag2?: number }): Promise<void> {
    // Validate
    if (!options.flag1) {
      this.printError('--flag1 is required')
      process.exit(1)
    }

    // Use case
    const usecase = new MyUseCase(...)
    const result = await usecase.execute({ ... })

    // Handle result
    if (!result.ok) {
      this.printError(result.error)
      process.exit(1)
    }

    // Output
    this.printSuccess(`Completed: ${result.value.id}`)
  }
}
```

### HTTP Endpoint

```typescript
export class MyHandler extends RouteHandler {
  async handle(req: Request, res: Response): Promise<void> {
    // Validate
    const validation = this.validateRequired(req.body, ['field1'])
    if (validation) return this.error(res, validation)

    // Use case
    const usecase = new MyUseCase(...)
    const result = await usecase.execute({ ... })

    // Handle result
    if (!result.ok) return this.error(res, result.error)

    // Output
    this.success(res, result.value, 200)
  }
}
```

### TUI Component Handler

```typescript
export class MyTuiHandler extends TuiHandler {
  async execute(params: any): Promise<any> {
    // Use case
    const usecase = new MyUseCase(...)
    const result = await usecase.execute({ ... })

    // Handle result
    if (!result.ok) throw result.error

    // Show feedback
    this.showToast('Success!', 'success')
    return result.value
  }
}
```

## Testing Presentation Layer

Presentation tests verify handlers work correctly with mocked use cases:

```typescript
import { describe, it, expect } from 'vitest'
import { CreateSessionCommand } from '@neocode-ai/presentation'

describe('CreateSessionCommand', () => {
  it('should call use case with CLI options', async () => {
    // Mock container
    const mockContainer = { ... }

    const command = new CreateSessionCommand(mockContainer)
    await command.execute({
      project: '/test',
      title: 'Test'
    })

    // Verify output printed
    // Verify exit code if error
  })
})
```

## Next Steps

Phase 4 is complete when:

- ✅ All CLI commands migrated to presentation handlers
- ✅ All HTTP routes migrated to presentation handlers
- ✅ TUI components refactored to use handlers
- ✅ No direct domain imports in presentation
- ✅ All old CLI/server code removed or migrated
- ✅ Presentation tests passing

### Phase 5: Cleanup (Next)

- Remove unnecessary barrel (index.ts) files
- Consolidate re-exports
- Enforce no-barrel-reexport ESLint rule

### Phase 6: Type Safety (Final)

- Remove all remaining `any` types
- Enable `exactOptionalPropertyTypes: true`
- Add stricter compiler options
- Improve type inference throughout

## Summary

| Aspect   | Purpose             | Imports             | Example                 |
| -------- | ------------------- | ------------------- | ----------------------- |
| **CLI**  | Terminal interface  | Application, Shared | CreateSessionCommand    |
| **HTTP** | REST API endpoints  | Application, Shared | CreateSessionHandler    |
| **TUI**  | Terminal UI (Solid) | Application, Shared | CreateSessionTuiHandler |

All presentation layers:

- Use the same application layer use cases
- Return the same DTOs to callers
- Follow consistent error handling
- Are testable with mocked containers
- Have zero business logic
