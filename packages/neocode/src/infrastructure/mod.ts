import type { Container } from '@neocode-ai/application'
import { Pool } from 'pg'
import { PostgresSessionRepository } from './persistence/postgres-session-repo'
import { PostgresProviderRepository } from './persistence/postgres-provider-repo'
import { RabbitMQEventBus } from './events/rabbitmq-event-bus'
import { ConsoleLogger } from './logging/console-logger'
import { FileLogger } from './logging/file-logger'
import { InMemorySessionRepository } from './persistence/in-memory-session-repo'
import { InMemoryEventBus } from './events/in-memory-event-bus'

export type InfraConfig = {
  postgresUrl?: string
  rabbitUrl?: string
  logFile?: string
  useInMemory?: boolean
}

export async function registerInfrastructure(container: Container, config: InfraConfig) {
  const logger = config.logFile ? new FileLogger(config.logFile) : new ConsoleLogger()
  container.register('logger', logger)

  if (config.useInMemory) {
    const sessionRepo = new InMemorySessionRepository()
    container.register('sessionRepository', sessionRepo)
    container.register('providerRepository', {
      findById: async () => ({ ok: true, value: [] }),
      listAll: async () => ({ ok: true, value: [] }),
      save: async (p: any) => ({ ok: true, value: p }),
      update: async (p: any) => ({ ok: true, value: p }),
      exists: async () => ({ ok: true, value: false })
    } as any)

    const bus = new InMemoryEventBus()
    container.register('eventBus', bus)
    return
  }

  if (config.postgresUrl) {
    const pool = new Pool({ connectionString: config.postgresUrl })
    const sessionRepo = new PostgresSessionRepository(pool)
    await sessionRepo.init()
    container.register('sessionRepository', sessionRepo)

    const providerRepo = new PostgresProviderRepository(pool)
    ```typescript
    import type { Container } from '@neocode-ai/application'
    import { ConsoleLogger } from './logging/console-logger'
    import { FileLogger } from './logging/file-logger'
    import { InMemorySessionRepository } from './persistence/in-memory-session-repo'
    import { InMemoryEventBus } from './events/in-memory-event-bus'

    export type InfraConfig = {
      postgresUrl?: string
      rabbitUrl?: string
      logFile?: string
      useInMemory?: boolean
    }

    export async function registerInfrastructure(container: Container, config: InfraConfig) {
      const logger = config.logFile ? new FileLogger(config.logFile) : new ConsoleLogger()
      container.register('logger', logger)

      if (config.useInMemory) {
        const sessionRepo = new InMemorySessionRepository()
        container.register('sessionRepository', sessionRepo)
        container.register('providerRepository', {
          findById: async () => ({ ok: true, value: [] }),
          listAll: async () => ({ ok: true, value: [] }),
          save: async (p: any) => ({ ok: true, value: p }),
          update: async (p: any) => ({ ok: true, value: p }),
          exists: async () => ({ ok: true, value: false })
        } as any)

        const bus = new InMemoryEventBus()
        container.register('eventBus', bus)
        return
      }

      if (config.postgresUrl) {
        try {
          const mod = await import('./persistence/postgres-session-repo.ts')
          const providerMod = await import('./persistence/postgres-provider-repo.ts')
          const { Pool } = await import('pg')
          const pool = new Pool({ connectionString: config.postgresUrl })
          const sessionRepo = new mod.PostgresSessionRepository(pool)
          await sessionRepo.init()
          container.register('sessionRepository', sessionRepo)

          const providerRepo = new providerMod.PostgresProviderRepository(pool)
          await providerRepo.init()
          container.register('providerRepository', providerRepo)
        } catch (err) {
          throw new Error(`Failed to load Postgres adapters: ${(err as Error).message}.\nIf you intend to use Postgres, install dependencies: 'bun add pg' or 'npm install pg' and try again.`)
        }
      }

      if (config.rabbitUrl) {
        try {
          const mod = await import('./events/rabbitmq-event-bus.ts')
          const { RabbitMQEventBus } = mod
          const bus = new RabbitMQEventBus(config.rabbitUrl)
          container.register('eventBus', bus)
        } catch (err) {
          throw new Error(`Failed to load RabbitMQ adapter: ${(err as Error).message}.\nIf you intend to use RabbitMQ, install dependencies: 'bun add amqplib' or 'npm install amqplib' and try again.`)
        }
      }

      if (!container.has('logger')) container.register('logger', logger)
    }

    ```
