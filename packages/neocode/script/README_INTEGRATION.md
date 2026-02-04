# Integration Smoke Test (Postgres + RabbitMQ)

This starts services with Docker Compose and runs a simple integration smoke test against Postgres and RabbitMQ.

Start services (from repo root):

```bash
docker compose -f docker/compose.smoke.yml up -d
```

Run the integration smoke test (from repo root):

```bash
# optionally set env vars
DATABASE_URL=postgres://neocode:secret@localhost:5432/neocode RABBITMQ_URL=amqp://guest:guest@localhost:5672 \
  bun packages/neocode/script/infra_integration_smoke.ts

# or with ts-node
npx ts-node packages/neocode/script/infra_integration_smoke.ts
```

Stop services:

```bash
docker compose -f docker/compose.smoke.yml down -v
```

Notes:

- The script retries registration while services become healthy.
- If running in CI, ensure a docker runner is available.
