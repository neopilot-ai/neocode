# TypeScript Architecture Review: Neocode Monorepo

**Date:** February 2026  
**Scope:** Full-stack TypeScript monorepo analysis  
**Focus:** Structure, scalability, maintainability, type safety, and developer experience

---

## Executive Summary

Neocode is a **sophisticated polyrepo-like monorepo** with 18+ packages spanning:

- CLI application (`neocode`, `desktop`)
- Web applications (`app`, `web`, `console`, `enterprise`)
- SDK/API layer (`sdk/js`)
- UI component library (`ui`)
- Infrastructure code (`infra/`)
- Utilities and shared modules

### Key Observations

✅ **Strengths:**

- Good package separation using Turbo workspace management
- Modern tooling (Bun, Vite, Solid.js)
- Multi-platform support (CLI, web, desktop)
- Catalog-based dependency management reduces version conflicts

⚠️ **Critical Issues:**

1. **Chaotic internal structure** - `packages/neocode/src` has 30+ domain folders with unclear dependencies
2. **Mixed concerns** - CLI/TUI/LSP/Server logic scattered without clear layer separation
3. **Barrel file overuse** - Many `index.ts` files create hidden dependencies and circular references
4. **Type safety gaps** - Inconsistent TypeScript configuration across packages
5. **Path aliases inconsistency** - Each package defines its own aliases (`@/*`, `@tui/*`)
6. **Weak import boundaries** - No enforcement of architectural layers
7. **Generated code not isolated** - SDK generated code in main source tree
8. **No monorepo-wide linting** - No ESLint/Prettier enforcement at root level

---

## Part 1: Current Architecture Audit

### 1.1 Package Structure Analysis

```
neocode/
├── packages/
│   ├── neocode/           ❌ Monolithic CLI (35 folders, unclear boundaries)
│   ├── app/               ✅ Web app (clear layering: pages, components, context)
│   ├── desktop/           ⚠️  Tauri wrapper (minimal structure)
│   ├── web/               ✅ Marketing site (docs, content)
│   ├── console/           ⚠️  Multi-level structure (app/, core/, function/, resource/)
│   ├── enterprise/        ✅ Solid Start app (routes, core)
│   ├── ui/                ✅ Component library (clear component organization)
│   ├── sdk/js/            ✅ Published SDK (v1, v2 split, generated code)
│   ├── util/              ⚠️  Flat utilities (11 modules without clear grouping)
│   ├── plugin/            ✅ Plugin system (clear exports)
│   ├── script/            ✅ Build scripts
│   ├── function/          ✅ Cloudflare functions
│   ├── containers/        ✅ Docker configs
│   ├── docs/              ✅ API docs
│   ├── identity/          ❌ Empty/undocumented
│   ├── slack/             ✅ Slack bot
│   └── extensions/        ✅ Third-party extensions (zed)
├── infra/                 ✅ Clear SST infrastructure
├── script/                ✅ Root-level automation scripts
└── github/                ✅ GitHub Actions
```

### 1.2 Problem Areas in `packages/neocode` (The Core)

The monolithic CLI application at `packages/neocode/src` is the biggest architectural concern:

```
src/
├── acp/                   Domain: AI Code Plan operations
├── agent/                 Domain: Agent management
├── auth/                  Domain: Authentication
├── bun/                   Infra: Bun runtime integration
├── bus/                   Infra: Event bus
├── cli/                   App layer
│   ├── cmd/              40+ command handlers (mixed concerns)
│   │   ├── tui/          Terminal UI (depends on renderer, theme context)
│   │   └── debug/        Debug commands
│   └── ui/               CLI UI rendering (couples to commands)
├── command/               Domain: Command execution abstraction
├── config/                Domain: Configuration schema
├── env/                   Infra: Environment loading
├── file/                  Domain: File operations (tight coupling to worktree)
├── flag/                  Domain: CLI flags
├── format/                Domain: Code formatting
├── global/                Infra: Global singleton state (!!)
├── id/                    Util: ID generation
├── ide/                   Domain: IDE/Editor integration
├── installation/          Domain: App installation/setup
├── lsp/                   Domain: LSP server (tight coupling with multiple domains)
├── mcp/                   Domain: Model Context Protocol
├── patch/                 Domain: Patch operations
├── permission/            Domain: Permission system
├── plugin/                Domain: Plugin system
├── project/               Domain: Project management
├── provider/              Domain: Provider/Model management (!!massive)
├── pty/                   Infra: PTY (terminal) spawning
├── question/              Domain: Question/Dialog prompts
├── scheduler/             Infra: Task scheduling
├── server/                App layer: HTTP server (tight coupling)
├── session/               Domain: Chat session management
├── share/                 Domain: Share/Export functionality
├── shell/                 Infra: Shell execution
├── skill/                 Domain: Skill management
├── snapshot/              Domain: Snapshot/Backup
├── storage/               Infra: File storage abstraction
├── tool/                  Domain: Tool/Extension point system
├── util/                  Catch-all utilities (!!)
├── worktree/              Domain: Git worktree management
└── index.ts              Entry point (39 commands imported)
```

### 1.3 Dependency Coupling Issues

**Problem: No clear dependency direction**

Example tangled imports (real code):

```typescript
// server/server.ts imports from:
- provider/              (model loading)
- session/              (session management)
- permission/           (authorization)
- file/                 (file operations)
- project/              (project context)
- mcp/                  (protocol handler)
- pty/                  (terminal)
- storage/              (persistence)

// CLI imports from:
- server/               (serves app)
- provider/             (lists models)
- session/              (manages sessions)
- project/              (scans projects)
- ALL command modules   (command routing)

// provider/ imports from:
- config/               (reads config)
- plugin/               (loads plugins)
- auth/                 (OAuth flow)
- util/                 (encoding, paths)
- bun/                  (Bun-specific APIs)
```

**Result:** Circular dependencies, hard to test, refactoring is risky.

### 1.4 TypeScript Configuration Inconsistencies

**Root tsconfig.json:**

```json
{
  "extends": "@tsconfig/bun/tsconfig.json",
  "compilerOptions": {}
}
```

❌ Too minimal, no defaults inherited by child packages.

**packages/neocode/tsconfig.json:**

```json
{
  "extends": "@tsconfig/bun/tsconfig.json",
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@opentui/solid",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "types": [],
    "noUncheckedIndexedAccess": false, // ⚠️ Type safety disabled
    "customConditions": ["browser"],
    "paths": {
      "@/*": ["./src/*"],
      "@tui/*": ["./src/cli/cmd/tui/*"]
    }
  }
}
```

⚠️ Issues:

- `noUncheckedIndexedAccess: false` - loses type safety on arrays/objects
- `types: []` - no global types, forces imports everywhere
- Each package redefines paths (maintenance burden)
- No shared `paths.json` reference

**packages/app/tsconfig.json:**

```json
{
  "target": "ESNext",
  "module": "ESNext",
  "strict": true,
  "jsx": "preserve",
  "jsxImportSource": "solid-js",
  "paths": {
    "@/*": ["./src/*"] // Different from neocode
  }
}
```

✅ Better strict mode, but inconsistent with neocode.

### 1.5 Import/Barrel File Problems

**Over-reliance on `index.ts` (barrel files):**

```typescript
// packages/ui/src/context/index.ts (15+ exports)
export * from "./dialog"
export * from "./notification"
export * from "./theme"
// ... many more, hard to track

// Usage creates implicit dependencies:
import { useDialog } from "@neocode-ai/ui/context" // What am I importing?
```

**Problems:**

1. **Hides true dependencies** - Can't see what modules use
2. **Slow build** - Forces TypeScript to analyze entire barrel
3. **Circular dependencies** - Common with barrel files
4. **Tree-shaking failures** - Harder for bundlers to optimize
5. **No gradual deprecation** - Can't remove exports without breaking code

### 1.6 Missing Import Boundaries

**No architectural rules enforced. Example violations:**

```typescript
// CLI importing directly from server internals:
import { App } from "@/server/server" // Should go through public API

// UI importing domain logic:
import { Provider } from "@neocode-ai/neocode/provider" // Architecture violation

// Server importing from CLI:
import { UI } from "@/cli/ui" // Circular dependency risk
```

---

## Part 2: Proposed Ideal Architecture

### 2.1 Layered Architecture Pattern

Adopt **Hexagonal (Ports & Adapters) Architecture** with clear boundaries:

```
┌─────────────────────────────────────────────┐
│           PRESENTATION LAYER                │
│  (CLI, Web UI, Desktop, API Handlers)       │
│  Responsibility: User I/O, routing          │
└──────────────┬──────────────────────────────┘
               │ (clean interfaces only)
┌──────────────▼──────────────────────────────┐
│        APPLICATION LAYER                    │
│  (Use cases, workflows, orchestration)      │
│  Responsibility: Business logic flow        │
└──────────────┬──────────────────────────────┘
               │ (domain models only)
┌──────────────▼──────────────────────────────┐
│           DOMAIN LAYER                      │
│  (Entities, business rules, invariants)     │
│  Responsibility: Pure business logic        │
└──────────────┬──────────────────────────────┘
               │ (abstract interfaces)
┌──────────────▼──────────────────────────────┐
│      INFRASTRUCTURE LAYER                   │
│  (Database, File I/O, HTTP, Events)         │
│  Responsibility: Technical implementation   │
└─────────────────────────────────────────────┘
```

### 2.2 Proposed Folder Structure for `packages/neocode`

```
packages/neocode/
├── src/
│   ├── index.ts                          # CLI entry point
│   ├── bin/                              # Executable wrapper
│   │   └── neocode                       # Binary script
│   │
│   ├── domain/                           # Pure business logic (no dependencies)
│   │   ├── session/                      # Session entities & rules
│   │   │   ├── types.ts                  # SessionID, SessionStatus, etc.
│   │   │   ├── aggregate.ts              # Session aggregate root
│   │   │   ├── events.ts                 # Session domain events
│   │   │   ├── value-objects.ts          # Message, Turn, etc.
│   │   │   └── errors.ts                 # Domain-specific errors
│   │   ├── project/
│   │   ├── provider/                     # Model provider domain
│   │   │   ├── types.ts                  # Provider, Model, Auth
│   │   │   ├── errors.ts
│   │   │   └── rules.ts                  # Business rules (e.g., provider compatibility)
│   │   ├── worktree/                     # Git worktree domain
│   │   ├── auth/                         # Authentication domain
│   │   ├── permission/                   # Permission rules
│   │   ├── skill/                        # Skill definition
│   │   └── tool/                         # Tool/MCP domain
│   │
│   ├── application/                      # Use cases & orchestration
│   │   ├── session/
│   │   │   ├── create-session.ts         # CreateSessionUseCase
│   │   │   ├── execute-step.ts           # ExecuteStepUseCase
│   │   │   ├── types.ts
│   │   │   └── commands/                 # Command DTOs
│   │   ├── provider/
│   │   │   ├── load-providers.ts
│   │   │   ├── configure-auth.ts
│   │   │   └── types.ts
│   │   ├── project/
│   │   ├── formatting/
│   │   └── port-implementations/         # Concrete port implementations
│   │       ├── event-bus/
│   │       ├── scheduler/
│   │       └── logger/
│   │
│   ├── infrastructure/                   # Technical implementation
│   │   ├── persistence/                  # Storage layer
│   │   │   ├── session-repository.ts
│   │   │   ├── sqlite/                   # SQLite implementation
│   │   │   └── memory/                   # In-memory (testing)
│   │   ├── runtime/                      # Bun/Node runtime
│   │   │   ├── bun-shell.ts
│   │   │   ├── bun-fs.ts
│   │   │   └── pty-spawn.ts
│   │   ├── network/                      # HTTP, LSP, MCP
│   │   │   ├── http-server.ts
│   │   │   ├── lsp-server.ts
│   │   │   └── mcp-transport.ts
│   │   ├── external-services/            # Provider APIs
│   │   │   ├── anthropic/
│   │   │   ├── openai/
│   │   │   └── provider-adapter.ts
│   │   └── config/                       # Configuration loading
│   │
│   ├── presentation/                     # User interface adapters
│   │   ├── cli/                          # Command-line interface
│   │   │   ├── commands/
│   │   │   │   ├── run-command.ts        # Adapts domain to CLI
│   │   │   │   ├── generate-command.ts
│   │   │   │   ├── model-command.ts
│   │   │   │   └── auth-command.ts
│   │   │   ├── argument-parser.ts        # Yargs configuration
│   │   │   └── command-router.ts
│   │   ├── tui/                          # Terminal UI
│   │   │   ├── components/
│   │   │   ├── screens/
│   │   │   ├── context/
│   │   │   └── tui-adapter.ts            # Bridges to domain
│   │   ├── server/                       # HTTP API adapter
│   │   │   ├── routes/
│   │   │   │   ├── session-routes.ts
│   │   │   │   ├── provider-routes.ts
│   │   │   │   └── project-routes.ts
│   │   │   ├── middleware/
│   │   │   └── error-handler.ts
│   │   └── plugin/                       # Plugin interface
│   │       └── plugin-adapter.ts
│   │
│   ├── shared/                           # Shared utilities (no business logic)
│   │   ├── types/
│   │   │   └── common.ts                 # Branded types, Result<T,E>
│   │   ├── utils/
│   │   │   ├── encoding.ts
│   │   │   ├── path.ts
│   │   │   └── retry.ts
│   │   ├── errors/
│   │   │   └── named-error.ts
│   │   └── logger/
│   │       └── structured-logger.ts
│   │
│   └── ports/                            # Port interfaces (adapters)
│       ├── persistence.ts                # ISessionRepository, IStorage
│       ├── event-bus.ts                  # IEventBus, IEventHandler
│       ├── logger.ts                     # ILogger
│       ├── scheduler.ts                  # IScheduler, IJob
│       ├── file-system.ts                # IFileSystem
│       ├── shell.ts                      # IShellExecutor
│       └── external-services.ts          # IProviderLoader, IAuthService
│
├── tests/
│   ├── unit/                             # Domain & application tests
│   │   ├── domain/
│   │   │   ├── session.test.ts
│   │   │   └── provider.test.ts
│   │   └── application/
│   │       ├── create-session.test.ts
│   │       └── execute-step.test.ts
│   ├── integration/                      # Cross-layer tests
│   │   ├── session-flow.test.ts
│   │   └── provider-integration.test.ts
│   └── fixtures/                         # Test data
│       ├── mocks/
│       └── builders/
│
├── tsconfig.json                         # Package-specific config
├── package.json
└── README.md
```

### 2.3 Architecture Rules (Enforceable)

Create `eslint-plugin-neocode-arch` to enforce:

```typescript
// .eslintrc.cjs
module.exports = {
  rules: {
    "neocode-arch/no-circular-deps": "error",
    "neocode-arch/layer-boundary": [
      "error",
      {
        layers: ["shared", "domain", "ports", "application", "infrastructure", "presentation"],
        rules: [
          // Presentation can import from application, ports, shared
          { from: "presentation", allow: ["application", "ports", "shared"] },
          // Application can import from domain, ports, shared
          { from: "application", allow: ["domain", "ports", "shared"] },
          // Infrastructure can import from ports, shared (but not domain directly)
          { from: "infrastructure", allow: ["ports", "shared"] },
          // Domain only imports from shared
          { from: "domain", allow: ["shared"] },
        ],
      },
    ],
    "neocode-arch/no-barrel-exports": [
      "warn",
      {
        exceptions: ["shared/utils", "ports"], // Allow barrel files only here
      },
    ],
    "neocode-arch/no-path-imports-outside-package": "error",
  },
}
```

---

## Part 3: TypeScript Improvements

### 3.1 Root `tsconfig.json` (Create Shared Defaults)

```jsonc
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "@tsconfig/bun/tsconfig.json",
  "compilerOptions": {
    // Strict type checking
    "strict": true,
    "noUncheckedIndexedAccess": true, // Force array indexing safety
    "noImplicitThis": true,
    "noImplicitAny": true,
    "useDefineForClassFields": true,

    // Module resolution
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",

    // Output
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",

    // Project references
    "composite": true,
    "tsBuildInfoFile": ".tsbuildinfo",

    // Interoperability
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "resolveJsonModule": true,

    // Advanced
    "skipLibCheck": true,
    "isolatedModules": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": false, // Set to true when ready

    // Shared path aliases (override in packages as needed)
    "baseUrl": ".",
    "paths": {
      "@neocode-ai/domain": ["packages/neocode/src/domain"],
      "@neocode-ai/application": ["packages/neocode/src/application"],
      "@neocode-ai/infrastructure": ["packages/neocode/src/infrastructure"],
      "@neocode-ai/presentation": ["packages/neocode/src/presentation"],
      "@neocode-ai/ports": ["packages/neocode/src/ports"],
      "@neocode-ai/shared": ["packages/neocode/src/shared"],
      "@neocode-ai/util": ["packages/util/src"],
      "@neocode-ai/ui": ["packages/ui/src"],
      "@neocode-ai/sdk": ["packages/sdk/js/src"],
      "@neocode-ai/sdk-v2": ["packages/sdk/js/src/v2"],
    },
  },
  "include": ["src", "tests"],
  "exclude": ["node_modules", "dist", "build", ".turbo"],
}
```

### 3.2 Package-Specific TypeScript Configs

**packages/neocode/tsconfig.json:**

```jsonc
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@opentui/solid",
    "lib": ["ESNext", "DOM", "DOM.Iterable"],
    "exactOptionalPropertyTypes": true, // Stricter than root
    "noUncheckedIndexedAccess": true,
    "paths": {
      // Override with package-local paths
      "@/domain": ["./src/domain"],
      "@/application": ["./src/application"],
      "@/infrastructure": ["./src/infrastructure"],
      "@/presentation": ["./src/presentation"],
      "@/ports": ["./src/ports"],
      "@/shared": ["./src/shared"],
    },
  },
  "references": [{ "path": "../util" }, { "path": "../ui" }],
}
```

### 3.3 Type Safety Improvements

**Create branded types for domain objects:**

```typescript
// src/domain/session/types.ts
import type { Brand } from "@neocode-ai/shared/types"

export type SessionId = Brand<string, "SessionId">
export type ProjectPath = Brand<string, "ProjectPath">
export type ModelId = Brand<string, "ModelId">

export const createSessionId = (value: string): SessionId => value as SessionId

// Usage prevents accidental mixing:
const session1: SessionId = createSessionId("abc")
const session2: SessionId = session1 // ✅ OK
const session3: string = session1 // ❌ Error (catches bugs)
```

**Use discriminated unions for domain events:**

```typescript
// src/domain/session/events.ts
export type SessionEvent =
  | { type: "session.created"; sessionId: SessionId; projectPath: ProjectPath }
  | { type: "session.started"; sessionId: SessionId }
  | { type: "session.error"; sessionId: SessionId; error: string }
  | { type: "session.completed"; sessionId: SessionId; duration: number }

// Type-safe handler:
const handleEvent = (event: SessionEvent) => {
  switch (event.type) {
    case "session.created":
      console.log(event.sessionId) // ✅ Type narrowed
      break
    case "session.error":
      console.log(event.error) // ✅ Has error property
  }
}
```

**Use `Result<T, E>` type for error handling:**

```typescript
// src/shared/types/result.ts
export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

export const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value })
export const Err = <E>(error: E): Result<never, E> => ({ ok: false, error })

// Usage:
async function loadProvider(id: ModelId): Promise<Result<Provider, ProviderError>> {
  // Implementation
}

// Type-safe consumption:
const result = await loadProvider(modelId)
if (result.ok) {
  console.log(result.value.name) // ✅ Type narrowed to Provider
} else {
  console.log(result.error.message) // ✅ Type narrowed to ProviderError
}
```

---

## Part 4: Code Organization Rules

### 4.1 Import Boundaries (ASCII Diagram)

```
                  ┌─── presentation ────┐
                  │ (CLI, Web, Server)  │
                  └──────────┬──────────┘
                             │
                  ┌──────────▼───────────┐
                  │   application       │
                  │ (Use cases, flows)   │
                  └──────────┬──────────┘
                             │
        ┌────────────┬───────┴────────┬─────────────┐
        │            │                │             │
    ┌───▼────┐ ┌────▼───┐ ┌──────────▼──┐ ┌───────▼──┐
    │ domain │ │ ports  │ │infra        │ │ shared   │
    └────────┘ └────────┘ └─────────────┘ └──────────┘

Rules:
• presentation → application ✅ (yes)
• presentation → domain ❌ (no)
• application → domain ✅ (yes)
• application → infrastructure ❌ (no)
• domain → anything except shared ❌ (no)
• infrastructure → domain ❌ (no)
• shared → any other layer ❌ (no, one-way dependency)
```

### 4.2 File Organization Rules

**Per-module public API:**

```typescript
// src/domain/session/mod.ts (or index.ts if must)
export type { SessionId, Session, SessionEvent } from "./types"
export { createSession, executeStep } from "./aggregate"
export type { ISessionRepository } from "./ports"

// Everything else is private (no direct imports)
// src/domain/session/internal/helpers.ts  ← private
// src/domain/session/value-objects.ts     ← don't import directly
```

**Naming conventions:**

```
✅ Good naming:
src/domain/session/types.ts           # Type definitions
src/domain/session/aggregate.ts       # Aggregate root logic
src/domain/session/errors.ts          # Domain-specific errors
src/domain/session/events.ts          # Domain events
src/domain/session/rules.ts           # Business rules
src/domain/session/value-objects.ts   # Value objects
src/domain/session/mod.ts             # Public API (barrel file exception)

src/application/session/create-session.ts  # Use case per file
src/application/session/commands/index.ts  # Command/DTO namespace

src/infrastructure/persistence/session-repository.ts
src/infrastructure/runtime/shell-executor.ts

src/presentation/cli/commands/session-command.ts
src/presentation/server/routes/session-routes.ts

❌ Avoid:
src/domain/session/index.ts           # Better: don't use barrel
src/domain/session/utils.ts           # Too vague
src/domain/session/helpers.ts         # Too vague
```

### 4.3 Barrel File Strategy

**Use barrel files ONLY for:**

1. Namespace organization (intentional grouping)
2. Encapsulation (hide internal complexity)

**Example - Good:**

```typescript
// src/ports/index.ts
export type { ISessionRepository } from "./session"
export type { IEventBus, IEventHandler } from "./event-bus"
export type { ILogger } from "./logger"
```

**Example - Bad:**

```typescript
// src/presentation/cli/index.ts  ❌ WRONG
export * from "./commands/run"
export * from "./commands/generate"
export * from "./argument-parser" // Why is this here?
```

### 4.4 Avoid Circular Dependencies

**Detection:**

```bash
# Use tsc-circular-dependency-check or similar:
pnpm add -D @badrap/tsc-circular-dependency-check
```

**Common patterns to avoid:**

```typescript
// ❌ Circular: session → event-bus → session
// src/domain/session/events.ts
import { eventBus } from "@/infrastructure/event-bus" // NOPE

// ✅ Fixed: Inject dependency
// src/domain/session/aggregate.ts
export const createSession = (
  id: SessionId,
  eventBus: IEventBus, // Injected, not imported
) => {
  // Use eventBus
}
```

---

## Part 5: TypeScript-Specific Improvements

### 5.1 Type Safety Checklist

| Issue                      | Current    | Target           | Priority     |
| -------------------------- | ---------- | ---------------- | ------------ |
| `strict: true`             | Partial    | All packages     | 🔴 Critical  |
| `noUncheckedIndexedAccess` | Disabled   | Enabled          | 🔴 Critical  |
| `noImplicitAny`            | Enabled    | ✅ Good          | ✅ OK        |
| `noImplicitThis`           | Enabled    | ✅ Good          | ✅ OK        |
| Branded types for IDs      | None       | Adopted          | 🟡 Important |
| Result<T,E> pattern        | Partial    | Monorepo-wide    | 🟡 Important |
| Discriminated unions       | Scattered  | Systematic       | 🟡 Important |
| `any` type usage           | Widespread | Eliminated       | 🔴 Critical  |
| `unknown` vs `any`         | Mixed      | Prefer `unknown` | 🟡 Important |

### 5.2 Remove All `any` Types

**Survey command:**

```bash
grep -r ":\s*any\|any\s*=>\|any\)" packages/neocode/src --include="*.ts" | wc -l
```

**Example fixes:**

```typescript
// ❌ Before
export interface ModelInfo {
  capabilities?: any
  config?: any
}

// ✅ After
export interface ModelCapabilities {
  reasoning: boolean
  input: Record<"text" | "image" | "audio", boolean>
  // ... explicit properties
}

export interface ModelConfig {
  temperature?: number
  maxTokens?: number
  // ... explicit properties
}

export interface ModelInfo {
  capabilities?: ModelCapabilities
  config?: ModelConfig
}
```

### 5.3 Generics & Type Inference Improvements

**Repository pattern with generics:**

```typescript
// ✅ Good: Single generic type parameter
export interface IRepository<T extends { id: string }> {
  get(id: T["id"]): Promise<T | null>
  save(item: T): Promise<void>
  delete(id: T["id"]): Promise<void>
}

// ✅ Good: Type inference
export const createRepository = <T extends { id: string }>(storage: IStorage): IRepository<T> => {
  return {
    get: (id) => storage.get<T>(id), // T inferred
    save: (item) => storage.set(item.id, item),
    delete: (id) => storage.delete(id),
  }
}

// Usage - type inferred:
const sessionRepo = createRepository<Session>(storage)
sessionRepo.save(session) // ✅ T = Session
```

**Conditional types for flexibility:**

```typescript
export type Awaited<T> = T extends Promise<infer U> ? U : T

export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>

// Usage:
const fn = (): Promise<string> => Promise.resolve("test")
type FnReturn = Awaited<ReturnType<typeof fn>> // string
```

---

## Part 6: Developer Experience & Tooling

### 6.1 Monorepo Root ESLint Config

**Create `.eslintrc.cjs` at root:**

```javascript
module.exports = {
  root: true,
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/strict-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
  ],
  plugins: ["@typescript-eslint", "import"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.json",
    ecmaVersion: "latest",
    sourceType: "module",
  },
  rules: {
    // Type safety
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-implicit-any-catch": "error",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      },
    ],

    // Import organization
    "import/order": [
      "error",
      {
        groups: ["builtin", "external", "internal", "parent", "sibling", "index"],
        pathGroups: [
          {
            pattern: "@neocode-ai/**",
            group: "internal",
            position: "after",
          },
        ],
        alphabeticalOrder: true,
      },
    ],

    // Naming
    "@typescript-eslint/naming-convention": [
      "warn",
      {
        selector: "default",
        format: ["camelCase"],
      },
      {
        selector: "variable",
        format: ["camelCase", "PascalCase", "UPPER_CASE"],
      },
      {
        selector: "typeLike",
        format: ["PascalCase"],
      },
    ],
  },
  overrides: [
    {
      files: ["packages/*/src/**/*.ts"],
      rules: {
        "neocode-arch/layer-boundary": "error",
        "neocode-arch/no-barrel-exports": "warn",
      },
    },
  ],
}
```

### 6.2 Prettier Configuration

**`.prettierrc.json`:**

```json
{
  "semi": false,
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "trailingComma": "es5",
  "arrowParens": "always"
}
```

### 6.3 Testing Structure

**Recommended layout:**

```
packages/neocode/
├── src/
└── tests/
    ├── setup.ts                 # Shared test configuration
    ├── vitest.config.ts         # Test runner config (use Vitest, not Bun test)
    ├── unit/
    │   ├── domain/
    │   │   ├── session.test.ts
    │   │   └── provider.test.ts
    │   ├── application/
    │   └── infrastructure/
    ├── integration/
    │   ├── session-flow.test.ts
    │   └── provider-api.test.ts
    ├── e2e/
    │   └── cli.test.ts
    └── fixtures/
        ├── mocks/
        │   ├── mock-session-repository.ts
        │   └── mock-event-bus.ts
        └── builders/
            ├── session-builder.ts
            └── provider-builder.ts
```

**Example test:**

```typescript
// tests/unit/domain/session.test.ts
import { describe, it, expect } from "vitest"
import { createSession } from "@neocode-ai/domain/session"
import type { SessionId, ProjectPath } from "@neocode-ai/domain/session"

describe("Session aggregate", () => {
  it("should create a new session with valid inputs", () => {
    const sessionId = "sess_123" as SessionId
    const projectPath = "/path/to/project" as ProjectPath

    const session = createSession(sessionId, projectPath)

    expect(session.id).toBe(sessionId)
    expect(session.projectPath).toBe(projectPath)
  })
})
```

---

## Part 7: Refactor Roadmap (Low Risk → High Impact)

### Phase 1: Foundation (Weeks 1-2) 🟢 Low Risk

**Goal:** Establish architectural rules and tooling.

1. ✅ **Create TypeScript configuration hierarchy**
   - Root `tsconfig.json` with shared settings
   - Update all package configs to extend root
   - Add `noUncheckedIndexedAccess: true` to all

   **Effort:** 4 hours | **Risk:** ✅ None | **Impact:** 📊 Medium

2. ✅ **Add ESLint to monorepo root**
   - Create root `.eslintrc.cjs`
   - Install TypeScript-ESLint plugins
   - Run eslint with `--fix` on all packages

   **Effort:** 6 hours | **Risk:** ✅ Low | **Impact:** 📊 Medium

3. ✅ **Create `src/shared` types in neocode**
   - Extract common types (Result, branded types, etc.)
   - Move from scattered locations
   - Export from `src/shared/mod.ts`

   **Effort:** 8 hours | **Risk:** ✅ Low | **Impact:** 📊 Medium

4. ✅ **Document architectural boundaries**
   - Create `ARCHITECTURE.md` with ASCII diagrams
   - Define what each layer does
   - List forbidden import patterns

   **Effort:** 4 hours | **Risk:** ✅ None | **Impact:** 📊 Medium

### Phase 2: Domain Extraction (Weeks 3-5) 🟡 Medium Risk

**Goal:** Separate pure domain logic from infrastructure.

1. **Create `src/domain` folder structure**
   - Move session business logic → `domain/session`
   - Move provider rules → `domain/provider`
   - Extract domain models & aggregates
   - Remove all external dependencies (no HTTP, file I/O, etc.)

   **Effort:** 16 hours | **Risk:** 🟡 Medium | **Impact:** 📊 High

   **Testing strategy:**
   - Create unit tests for each domain entity
   - Verify no external I/O happens
   - Check type safety with branded IDs

2. **Create `src/ports` interfaces**
   - Define `ISessionRepository`, `IProviderLoader`, etc.
   - Export only types (no implementations)
   - Document contract each port provides

   **Effort:** 8 hours | **Risk:** 🟡 Medium | **Impact:** 📊 High

3. **Move storage logic → `infrastructure/persistence`**
   - Current: scattered in `storage/`, `session/`, etc.
   - Target: Centralized repository implementations
   - Inject via dependency container

   **Effort:** 12 hours | **Risk:** 🟡 Medium | **Impact:** 📊 Medium

### Phase 3: Application Layer (Weeks 6-8) 🟡 Medium Risk

**Goal:** Create use case layer that orchestrates domain & infrastructure.

1. **Create `src/application` use cases**
   - `CreateSessionUseCase` - orchestrates domain + repos
   - `ExecuteStepUseCase` - handles step execution flow
   - `LoadProvidersUseCase` - loads and filters providers
   - Each use case = single file, takes ports in constructor

   **Effort:** 20 hours | **Risk:** 🟡 Medium | **Impact:** 📊 High

2. **Create dependency injection container**
   - Use `tsyringe` or simple hand-written IOC
   - Wire up domain → application → presentation
   - Enables testing with mocked dependencies

   **Effort:** 8 hours | **Risk:** 🟡 Medium | **Impact:** 📊 High

3. **Write integration tests**
   - Test use cases with mock repositories
   - Verify cross-layer interaction
   - Catch breaking changes early

   **Effort:** 12 hours | **Risk:** ✅ Low | **Impact:** 📊 Medium

### Phase 4: Presentation Layer Cleanup (Weeks 9-11) 🟡 Medium Risk

**Goal:** Organize CLI and server interfaces.

1. **Reorganize `src/presentation/cli`**
   - Move command handlers to `presentation/cli/commands/`
   - Each command: parse args → call use case → format output
   - Remove direct domain imports (go through application)

   **Effort:** 16 hours | **Risk:** 🟡 Medium | **Impact:** 📊 Medium

2. **Reorganize `src/presentation/server`**
   - Route files under `routes/`
   - Each route: parse request → call use case → respond
   - Centralized error handling middleware

   **Effort:** 12 hours | **Risk:** 🟡 Medium | **Impact:** 📊 Medium

3. **Move TUI → `src/presentation/tui`**
   - Separate rendering logic from state management
   - Create tui-adapter for use case interactions
   - Simplify context dependencies

   **Effort:** 14 hours | **Risk:** 🟡 Medium | **Impact:** 📊 Medium

### Phase 5: Barrel File Cleanup (Week 12) 🟢 Low Risk

**Goal:** Remove unnecessary barrel files, simplify imports.

1. **Audit all `index.ts` files**
   - Keep only intentional namespace barrels (`ports/`, `shared/`, `domain/`)
   - Remove intermediate barrels
   - Update imports across codebase

   **Effort:** 10 hours | **Risk:** 🟢 Low | **Impact:** 📊 Medium

2. **Add import validation rules**
   - ESLint plugin to prevent barrel re-exports
   - Enforce direct imports from modules

   **Effort:** 4 hours | **Risk:** 🟢 Low | **Impact:** 📊 Low

### Phase 6: Type Safety Pass (Week 13) 🔴 High Risk

**Goal:** Eliminate all remaining `any` types, enable strict mode.

1. **Remove `any` type usage**
   - Scan codebase: `grep -r ": any"` packages/neocode/src
   - Replace with proper types
   - Use `unknown` when truly unknown

   **Effort:** 16 hours | **Risk:** 🔴 High | **Impact:** 📊 High

2. **Enable stricter compiler options**
   - `exactOptionalPropertyTypes: true`
   - `noUncheckedIndexedAccess: true` (already done)
   - Fix resulting errors

   **Effort:** 12 hours | **Risk:** 🔴 High | **Impact:** 📊 High

3. **Fix type inference issues**
   - Update function signatures for better inference
   - Use proper generics
   - Verify no type regressions

   **Effort:** 8 hours | **Risk:** 🔴 High | **Impact:** 📊 Medium

### Timeline Summary

```
Phase 1 (Foundation):        Weeks 1-2   (22 hours)     ✅ Low risk
Phase 2 (Domain):           Weeks 3-5   (36 hours)     🟡 Medium
Phase 3 (Application):      Weeks 6-8   (40 hours)     🟡 Medium
Phase 4 (Presentation):     Weeks 9-11  (42 hours)     🟡 Medium
Phase 5 (Barrel files):     Week 12     (14 hours)     ✅ Low risk
Phase 6 (Type safety):      Week 13     (36 hours)     🔴 High

TOTAL:                       ~13 weeks   (190 hours)    4-5 developers
```

---

## Part 8: Quick Wins (Do Now)

### 8.1 Immediate Changes (< 2 hours each)

1. **Add `.prettierignore` and `.eslintignore`**

   ```
   dist/
   build/
   node_modules/
   packages/*/gen/
   packages/sdk/js/src/v2/gen/
   ```

2. **Enable `noUncheckedIndexedAccess` globally**
   - Add to root `tsconfig.json`
   - Fix resulting errors with optional chaining

3. **Create `src/shared/types/index.ts`**

   ```typescript
   export type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }
   export type Brand<T, B> = T & { readonly __brand: B }
   ```

4. **Add import/order ESLint rule**
   - Organize imports consistently across codebase

### 8.2 Prevents Future Damage (Do This Week)

1. **Rename `packages/neocode/src/global`**
   - Rename to `packages/neocode/src/infrastructure/state`
   - Use explicit dependency injection instead

2. **Move generated SDK code to `gen/` folder**
   - Don't import from generated files
   - Create hand-written wrapper APIs

3. **Document no-go zones**
   - Create `FORBIDDEN_IMPORTS.md`
   - CI check: fail if violated

---

## Part 9: Success Metrics

### Architectural Quality

| Metric                               | Current | Target | Timeline |
| ------------------------------------ | ------- | ------ | -------- |
| Cyclomatic complexity (max per file) | 15+     | < 10   | Month 2  |
| Circular dependencies                | 3+      | 0      | Month 2  |
| Type coverage (`any` count)          | 50+     | 0      | Month 3  |
| Max import depth                     | 8+      | < 5    | Month 2  |
| Lines per file (P95)                 | 600+    | < 300  | Month 3  |

### Developer Experience

| Metric                            | Current | Target  | Timeline |
| --------------------------------- | ------- | ------- | -------- |
| Build time (full)                 | 30s+    | < 15s   | Month 2  |
| Typecheck time                    | 10s+    | < 5s    | Month 2  |
| Time to understand new feature    | 30min+  | < 10min | Month 3  |
| Refactor risk (lines touched avg) | 40+     | < 15    | Month 3  |

### Team Velocity

| Metric                   | Current    | Target     | Timeline |
| ------------------------ | ---------- | ---------- | -------- |
| Bugs from type errors    | 2-3/sprint | < 1/sprint | Month 2  |
| Code review cycles (avg) | 3+         | < 2        | Month 3  |
| Time spent debugging     | High       | Medium     | Month 3  |

---

## Conclusion

The Neocode monorepo is **production-ready but architecturally at an inflection point**. Without restructuring now, it will become increasingly difficult to:

1. Onboard new developers
2. Refactor safely
3. Prevent type errors
4. Test in isolation
5. Scale to 10+ engineers

**Recommended approach:**

1. **Do Phase 1 (Foundation) immediately** - no risk, immediate value
2. **Start Phase 2 (Domain) next sprint** - unblocks testing and type safety
3. **Execute Phases 3-6 iteratively** - maintain velocity while improving

The layered architecture with clear boundaries will enable:

- ✅ Safe refactoring (one layer at a time)
- ✅ Easy testing (mock any layer)
- ✅ Clear onboarding (each person owns one layer)
- ✅ Type safety (domain is always correct by construction)
- ✅ Performance (easier to optimize after separation)

Start with the foundation, build momentum, and watch code quality improve measurably week over week.
