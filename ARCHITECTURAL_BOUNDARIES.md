# Architectural Boundaries & Import Rules

This document defines the architectural layers and import boundaries for the Neocode monorepo.

## Layer Architecture

```
┌─────────────────────────────────────────────┐
│         PRESENTATION LAYER                  │
│    (CLI, Web UI, Server, TUI, Plugins)      │
│  Responsibility: User I/O, request handling │
└──────────────┬──────────────────────────────┘
               │ (clean interfaces only)
┌──────────────▼──────────────────────────────┐
│      APPLICATION LAYER                      │
│  (Use cases, workflows, orchestration)      │
│  Responsibility: Business logic flow        │
└──────────────┬──────────────────────────────┘
               │ (domain models only)
┌──────────────▼──────────────────────────────┐
│        DOMAIN LAYER                         │
│  (Entities, business rules, invariants)     │
│  Responsibility: Pure business logic        │
└──────────────┬──────────────────────────────┘
               │ (abstract interfaces)
┌──────────────▼──────────────────────────────┐
│    INFRASTRUCTURE LAYER                     │
│  (Database, File I/O, HTTP, Events, etc.)   │
│  Responsibility: Technical implementation   │
└──────────────┬──────────────────────────────┘
               │ (implementations of ports)
┌──────────────▼──────────────────────────────┐
│      PORTS & ADAPTERS                       │
│  (Abstract interfaces for external systems) │
│  Responsibility: Decouple from specifics    │
└──────────────┬──────────────────────────────┘
               │ (no external dependencies)
┌──────────────▼──────────────────────────────┐
│      SHARED LAYER                           │
│  (Types, utilities, common errors)          │
│  Responsibility: Cross-layer utilities      │
└─────────────────────────────────────────────┘
```

## Import Rules

### ✅ ALLOWED IMPORTS

```
presentation → application ✅
presentation → ports ✅
presentation → shared ✅

application → domain ✅
application → ports ✅
application → shared ✅

infrastructure → ports ✅
infrastructure → shared ✅

domain → shared ✅

shared → (nothing) ✅
```

### ❌ FORBIDDEN IMPORTS

```
presentation → domain ❌ (skip application layer)
presentation → infrastructure ❌ (skip layers)

application → infrastructure ❌ (should be injected via ports)
application → presentation ❌ (circular dependency)

infrastructure → domain ❌ (only via ports)
infrastructure → application ❌ (wrong direction)
infrastructure → presentation ❌ (wrong direction)

domain → (anything but shared) ❌ (must be pure)
shared → (any other layer) ❌ (one-way dependency)
```

## Folder Structure

### packages/neocode/src/

```
src/
├── domain/                    # Pure business logic
│   ├── session/
│   ├── project/
│   ├── provider/
│   ├── auth/
│   └── ...
│
├── application/               # Use cases & orchestration
│   ├── session/
│   ├── project/
│   └── ...
│
├── infrastructure/            # Technical implementations
│   ├── persistence/
│   ├── runtime/
│   ├── network/
│   ├── external-services/
│   └── config/
│
├── presentation/              # User interface adapters
│   ├── cli/
│   ├── server/
│   ├── tui/
│   └── plugin/
│
├── ports/                      # Abstract interfaces
│   ├── persistence.ts
│   ├── event-bus.ts
│   ├── logger.ts
│   └── ...
│
└── shared/                     # Cross-layer utilities
    ├── types/
    ├── utils/
    └── errors/
```

## File Naming Conventions

### Domain Layer

- `types.ts` - Type definitions for domain entities
- `aggregate.ts` - Aggregate root logic
- `value-objects.ts` - Value objects
- `errors.ts` - Domain-specific errors
- `events.ts` - Domain events
- `rules.ts` - Business rules
- `mod.ts` - Public API (barrel exception)

### Application Layer

- `{use-case}-use-case.ts` - Individual use case per file
- `commands/` - Command/DTO namespace
- `mod.ts` - Public API

### Infrastructure Layer

- `{feature}-repository.ts` - Repository implementations
- `{feature}-adapter.ts` - Adapter implementations

### Presentation Layer

- `cli/commands/{command}-command.ts` - CLI command handlers
- `server/routes/{resource}-routes.ts` - HTTP routes
- `tui/screens/{screen}.tsx` - TUI screens

### Shared Layer

- `types/` - Type definitions
- `utils/` - Utility functions
- `errors/` - Common error classes

## Barrel File Strategy

### ✅ USE BARREL FILES FOR:

1. Namespace organization (intentional grouping)
2. Encapsulation (hide internal complexity)
3. Public API definition

**Examples:**

```typescript
// src/shared/types/mod.ts ✅ GOOD
export type { Result, AsyncResult } from "./result"
export { Ok, Err, isOk, isErr } from "./result"

// src/ports/mod.ts ✅ GOOD
export type { ISessionRepository } from "./session"
export type { IEventBus } from "./event-bus"
```

### ❌ AVOID BARREL FILES FOR:

1. Intermediate directories (use direct imports)
2. Mixing concerns
3. Hiding implementation details

**Examples:**

```typescript
// src/presentation/cli/index.ts ❌ BAD
export * from "./commands/run"
export * from "./commands/generate"
// Use: import { RunCommand } from '@/presentation/cli/commands/run'

// src/domain/session/index.ts ❌ BAD
export * from "./aggregate"
export * from "./types"
// Use: import { SessionId } from '@/domain/session/types'
```

## Circular Dependency Prevention

### ❌ Pattern to Avoid:

```typescript
// session → event-bus → session (CIRCULAR)
// src/domain/session/events.ts
import { eventBus } from "@/infrastructure/event-bus" // ❌ NOPE
```

### ✅ Correct Pattern:

```typescript
// Inject dependency instead
// src/domain/session/aggregate.ts
export const createSession = (
  id: SessionId,
  eventBus: IEventBus, // Injected via constructor/parameter
) => {
  // Use eventBus through interface
}
```

## Import Organization

Within each file, organize imports in this order:

1. Node.js/Bun built-ins
2. External packages
3. Internal monorepo packages (`@neocode-ai/*`)
4. Local relative imports

**Example:**

```typescript
import { promises as fs } from "fs"
import path from "path"

import { z } from "zod"
import { Hono } from "hono"

import { Session } from "@neocode-ai/domain/session"
import { IEventBus } from "@neocode-ai/ports"

import { formatError } from "./errors"
```

## Type Safety Standards

### Branded Types for IDs

```typescript
// ✅ DO: Use branded types for ID safety
import type { SessionId, ProjectPath } from "@neocode-ai/shared/types"

const session = createSession(sessionId("abc"), projectPath("/project"))

// ❌ DON'T: Use raw strings
const session = createSession("abc", "/project")
```

### Result Type for Errors

```typescript
// ✅ DO: Use Result type for error handling
import type { Result } from "@neocode-ai/shared/types"

async function loadProvider(id: ModelId): Promise<Result<Provider>> {
  // ...
}

// ❌ DON'T: Use exceptions for control flow
async function loadProvider(id: ModelId): Promise<Provider> {
  // ...
}
```

### Avoid `any`

```typescript
// ✅ DO: Use proper types
function process(data: unknown): string {
  if (typeof data === "string") return data
  throw new Error("Expected string")
}

// ❌ DON'T: Use any
function process(data: any): any {
  return data
}
```

## Enforcement

### ESLint Rules

- `@typescript-eslint/no-explicit-any` - error
- `import/no-cycle` - warn
- `import/order` - error

### TypeScript Config

- `noUncheckedIndexedAccess: true`
- `strict: true`
- `noImplicitAny: true`
- `noImplicitOverride: true`

### CI Checks

- Typecheck must pass
- ESLint must pass
- No imports from forbidden layers

## Questions?

Refer back to [ARCHITECTURE_REVIEW.md](../ARCHITECTURE_REVIEW.md) for detailed rationale and refactor roadmap.
