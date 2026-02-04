# Phase 5: Infrastructure (Postgres, RabbitMQ, Logger)

## Goal

Implement concrete infrastructure adapters for the ports:

- `PostgresSessionRepository` and `PostgresProviderRepository`
- `RabbitMQEventBus`
- `ConsoleLogger` (and simple file logger option)
- `InMemory` fallbacks for CI/local testing
- `registerInfrastructure(container, config)` helper to wire everything

## Files Added

- `src/infrastructure/persistence/postgres-session-repo.ts`
- `src/infrastructure/persistence/postgres-provider-repo.ts`
- `src/infrastructure/persistence/in-memory-session-repo.ts`
- `src/infrastructure/events/rabbitmq-event-bus.ts`
- `src/infrastructure/events/in-memory-event-bus.ts`
- `src/infrastructure/logging/console-logger.ts`
- `src/infrastructure/mod.ts` (bootstrap helper)

## Usage

### Local / CI (in-memory)

```ts
import { createContainer } from "@neocode-ai/application"
import { registerInfrastructure } from "@neocode-ai/infrastructure"

const container = createContainer()
await registerInfrastructure(container, { useInMemory: true })

// Validate
container.validate()

setGlobalContainer(container)
```

### Production (Postgres + RabbitMQ)

Requires running Postgres and RabbitMQ instances. Provide connection strings via env vars.

```ts
import { Pool } from "pg"
import { createContainer } from "@neocode-ai/application"
import { registerInfrastructure } from "@neocode-ai/infrastructure"

const container = createContainer()
await registerInfrastructure(container, {
  postgresUrl: process.env.DATABASE_URL,
  rabbitUrl: process.env.RABBITMQ_URL,
})
container.validate()
setGlobalContainer(container)
```

Make sure to run DB migrations or allow the repository `init()` methods to create the tables.

## Database Schema

The Postgres repositories create simple JSONB-backed tables. Example SQL is executed in `init()`:

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  project_path TEXT NOT NULL,
  state JSONB NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
)

CREATE TABLE IF NOT EXISTS providers (
  id TEXT PRIMARY KEY,
  state JSONB NOT NULL,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL
)
```

## Environment Variables

- `DATABASE_URL` - Postgres connection string (e.g. `postgres://user:pass@host:5432/dbname`)
- `RABBITMQ_URL` - RabbitMQ connection string (e.g. `amqp://guest:guest@localhost:5672`)

## Smoke Test (Local)

1. Use in-memory infra to run a quick smoke test without external services:

```bash
# From repo root
# Run a node/bun script that bootstraps container with useInMemory:true and exercises a use case
# Example (pseudo):
node packages/neocode/script/infra_smoke_test.js
```

2. For real infra use Postgres & RabbitMQ, ensure services are running and env vars set.

## Notes

- `RabbitMQEventBus.unsubscribe()` is intentionally minimal; if you need consumer cancellation we can add consumer tag tracking.
- The Postgres repositories store full aggregate state as JSONB for speed of iteration; you can implement normalized columns later if needed.

## Next Steps

- Add `FileLogger` that writes logs to rotating files
- Add metrics hooks to event bus and repositories
- Add migration scripts for Postgres (optional)
