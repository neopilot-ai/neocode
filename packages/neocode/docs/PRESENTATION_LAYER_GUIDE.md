# Presentation Layer Integration Guide

## Quick Start

### 1. Setup Container at Application Bootstrap

```typescript
// main.ts or bootstrap.ts
import {
  createContainer,
  setGlobalContainer,
  CreateSessionUseCase,
  LoadProvidersUseCase,
} from "@neocode-ai/application"
import { PostgresSessionRepository } from "./infrastructure/persistence/session"
import { PostgresProviderRepository } from "./infrastructure/persistence/provider"
import { RabbitMQEventBus } from "./infrastructure/events"
import { ConsoleLogger } from "./infrastructure/logging"

// Create and configure container
const container = createContainer()
container.register("sessionRepository", new PostgresSessionRepository(db))
container.register("providerRepository", new PostgresProviderRepository(db))
container.register("eventBus", new RabbitMQEventBus(connection))
container.register("logger", new ConsoleLogger())

// Validate all required services are registered
container.validate()

// Set globally accessible
setGlobalContainer(container)

// Now handlers can use it
const handler = new CreateSessionHandler(container)
```

### 2. Use CLI Commands

```typescript
// bootstrap.ts or CLI entry point
import { CreateSessionCommand, ListProvidersCommand } from "@neocode-ai/presentation"
import { getGlobalContainer } from "@neocode-ai/application"

async function main() {
  const container = getGlobalContainer()

  if (process.argv[2] === "session:create") {
    const cmd = new CreateSessionCommand(container)
    await cmd.execute({
      project: process.argv[3],
      title: process.argv[4],
    })
  }

  if (process.argv[2] === "provider:list") {
    const cmd = new ListProvidersCommand(container)
    await cmd.execute()
  }
}

main()
```

### 3. Use HTTP Handlers (Express)

```typescript
// routes/sessions.ts
import { Router } from "express"
import { CreateSessionHandler, AddMessageHandler } from "@neocode-ai/presentation"
import { getGlobalContainer } from "@neocode-ai/application"

const router = Router()
const container = getGlobalContainer()

// POST /api/sessions
router.post("/", async (req, res) => {
  const handler = new CreateSessionHandler(container)
  await handler.handle(req, res)
})

// POST /api/sessions/:sessionId/messages
router.post("/:sessionId/messages", async (req, res) => {
  const handler = new AddMessageHandler(container)
  await handler.handle(req, res)
})

export default router
```

### 4. Use TUI Handlers (Solid.js)

```typescript
// cli/cmd/tui/routes/session/create.tsx
import { createResource, Show } from 'solid-js'
import { CreateSessionTuiHandler } from '@neocode-ai/presentation'
import { useSDK } from '@tui/context/sdk'
import { Spinner } from '@tui/component/spinner'

export function CreateSessionDialog() {
  // Get container from context (setup at TUI bootstrap)
  const sdk = useSDK()
  const handler = new CreateSessionTuiHandler(getContainer()) // Context or global

  const [session] = createResource(
    () => ({ projectPath: '/project' }),
    (params) => handler.execute(params)
  )

  return (
    <Show when={session()} fallback={<Spinner />}>
      <div>Created: {session().id}</div>
    </Show>
  )
}
```

## Migration Checklist

### ✅ CLI Commands

```
☐ CreateSessionCommand - moved to presentation/cli/commands/
☐ AddMessageCommand - moved to presentation/cli/commands/
☐ ListProvidersCommand - moved to presentation/cli/commands/
☐ Update cli/bootstrap.ts to use new command handlers
☐ Remove old direct domain imports from CLI
```

### ✅ HTTP Routes

```
☐ CreateSessionHandler - moved to presentation/server/handlers/
☐ AddMessageHandler - moved to presentation/server/handlers/
☐ LoadProvidersHandler - moved to presentation/server/handlers/
☐ Update server/routes/* to use handlers
☐ Remove old direct domain imports from routes
```

### ✅ TUI Components

```
☐ CreateSessionTuiHandler - available in presentation/tui/
☐ LoadProvidersTuiHandler - available in presentation/tui/
☐ Update TUI components to use handlers instead of direct use cases
☐ Ensure createResource() properly calls handler.execute()
☐ Remove old direct domain imports from TUI components
```

## Examples

### CLI: Create Session and Add Message

```bash
# Command line
$ neocode session create --project /my/project --title "Debug Session"
✅ Session created: sess_123456

$ neocode message add --session sess_123456 --role user --text "What is this code?"
✅ Message added: msg_000001
```

### HTTP: Full Session Workflow

```bash
# Create session
$ curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"projectPath": "/project", "title": "API Session"}'

Response:
{
  "ok": true,
  "data": {
    "id": "sess_abc123",
    "projectPath": "/project",
    "title": "API Session",
    "status": "idle",
    "messageCount": 0,
    "createdAt": 1707000000000,
    "updatedAt": 1707000000000
  }
}

# Add message
$ curl -X POST http://localhost:3000/api/sessions/sess_abc123/messages \
  -H "Content-Type: application/json" \
  -d '{
    "role": "user",
    "parts": [{"type": "text", "text": "Hello!"}]
  }'

Response:
{
  "ok": true,
  "data": {
    "id": "msg_001",
    "role": "user",
    "parts": [{"type": "text", "text": "Hello!"}],
    "timestamp": 1707000000000
  }
}
```

### TUI: Dialog Component

```tsx
// Show dialog for creating session
export function SessionCreateDialog(props: { onClose: () => void }) {
  const handler = new CreateSessionTuiHandler(getContainer())

  const [session, { mutate }] = createResource(async () => {
    return await handler.execute({
      projectPath: local.projectPath,
      title: "New Session",
    })
  })

  return (
    <Dialog onClose={props.onClose}>
      <Show when={!session.loading} fallback={<Spinner />}>
        <Show when={session()} fallback={<div>Error: {session.error?.message}</div>}>
          <div>Session created: {session().id}</div>
        </Show>
      </Show>
    </Dialog>
  )
}
```

## Error Handling Examples

### CLI Error Response

```typescript
// User input invalid
❌ Error: Missing required field: projectPath

// Session not found
❌ Error: Session not found

// Use case failed
❌ Error: Failed to create session
```

### HTTP Error Responses

```javascript
// Bad request (400)
{
  "ok": false,
  "error": "Missing required field: projectPath"
}

// Not found (404)
{
  "ok": false,
  "error": "Session not found"
}

// Server error (500)
{
  "ok": false,
  "error": "Failed to create session"
}
```

### TUI Error Handling

```tsx
const [session] = createResource(
  () => ({ projectPath: '/project' }),
  (params) => handler.execute(params).catch(err => {
    showToast(err.message, 'error')
    throw err
  })
)

// Solid catches error and calls fallback
<Show when={session()} fallback={<ErrorMessage error={session.error} />}>
  <SessionInfo session={session()} />
</Show>
```

## Best Practices

### 1. Always Use Container

```typescript
// ❌ Don't create use cases directly
const usecase = new CreateSessionUseCase(repo, bus, logger)

// ✅ Always get from container
const usecase = new CreateSessionUseCase(
  container.getSessionRepository(),
  container.getEventBus(),
  container.getLogger(),
)
```

### 2. Translate Errors for Users

```typescript
// ❌ Leak technical errors
if (!result.ok) {
  this.printError(result.error.message) // "Database connection failed"
}

// ✅ User-friendly messages
if (!result.ok) {
  this.printError("Could not save session. Try again?")
}
```

### 3. Validate Early

```typescript
// ❌ Let use case handle validation
const result = await usecase.execute(req.body)

// ✅ Validate before use case
const validation = this.validateRequired(req.body, ["projectPath"])
if (validation) return this.error(res, validation)
```

### 4. Use Base Classes

```typescript
// ❌ Repeat error handling in every handler
class MyHandler {
  async handle(req, res) {
    try {
      // ... logic ...
    } catch (error) {
      res.status(500).json({ error })
    }
  }
}

// ✅ Extend base class
class MyHandler extends RouteHandler {
  async handle(req, res) {
    // Built-in this.error(res, msg)
  }
}
```

## Common Issues

### Issue: "Global container not initialized"

**Problem:** Accessing container before setting it globally

**Solution:** Call `setGlobalContainer()` at application startup, before any handlers are used

```typescript
// main.ts
const container = createContainer()
// ... register services ...
setGlobalContainer(container) // Must do this!
// ... now safe to use handlers ...
```

### Issue: "Missing required services"

**Problem:** Container not fully configured

**Solution:** Call `container.validate()` to fail-fast

```typescript
const container = createContainer()
container.register('sessionRepository', ...)
container.register('providerRepository', ...)
container.validate()  // Throws if anything missing
```

### Issue: Handlers not accessible from existing code

**Problem:** Old imports and code paths still exist

**Solution:** Update imports to use presentation layer handlers

```typescript
// Old way (remove)
import { SessionFactory } from "@neocode-ai/domain"

// New way (add)
import { CreateSessionCommand } from "@neocode-ai/presentation"
```

## Architecture Validation

Check that your presentation layer correctly uses only:

```typescript
// ✅ Application layer imports
import { CreateSessionUseCase, type SessionResponse } from "@neocode-ai/application"

// ✅ Shared utility imports
import { type Result } from "@neocode-ai/shared/types/result"

// ✅ Base class imports
import { CommandHandler, RouteHandler, TuiHandler } from "@neocode-ai/presentation"

// ❌ Should NEVER import (catch with ESLint rule)
import { Session, SessionFactory } from "@neocode-ai/domain" // WRONG!
import { PostgresSessionRepository } from "@neocode-ai/infrastructure" // WRONG!
```

Set up ESLint to enforce this:

```javascript
// .eslintrc.cjs
{
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          '@neocode-ai/domain/*',
          '@neocode-ai/infrastructure/*'
        ]
      }
    ]
  }
}
```
