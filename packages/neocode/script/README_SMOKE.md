# Infra Smoke Test (in-memory)

This script runs a minimal end-to-end smoke test using the in-memory infrastructure adapters.
It exercises the `CreateSessionUseCase` with the `InMemorySessionRepository` and `InMemoryEventBus`.

Run (from repo root):

```bash
# Using Bun to run TypeScript directly
bun packages/neocode/script/infra_smoke_test.ts

# Or with node + ts-node if you prefer
# npx ts-node packages/neocode/script/infra_smoke_test.ts
```

Exit codes:

- `0` success (use-case returned Ok)
- `1` use-case returned Err
- `2` script crashed

`registerInfrastructure(container, { useInMemory: true })` is used so no external services are required.
