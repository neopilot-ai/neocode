import { Pool } from "pg"
import type { IProviderRepository } from "@neocode-ai/ports/persistence"
import type { Provider } from "@neocode-ai/domain/provider"
import { Ok, Err } from "@neocode-ai/shared/types/result"

export class PostgresProviderRepository implements IProviderRepository {
  private pool: Pool
  private table = "providers"

  constructor(pool: Pool) {
    this.pool = pool
  }

  async init(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
        id TEXT PRIMARY KEY,
        state JSONB NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `
    await this.pool.query(sql)
  }

  async findById(id: string) {
    const { rows } = await this.pool.query(`SELECT state FROM ${this.table} WHERE id = $1`, [id])
    if (rows.length === 0) return Err(new Error("Provider not found"))
    return Ok(rows[0].state as Provider)
  }

  async listAll() {
    const { rows } = await this.pool.query(`SELECT state FROM ${this.table}`)
    return Ok(rows.map((r) => r.state as Provider))
  }

  async save(provider: Provider) {
    const now = Date.now()
    await this.pool.query(
      `INSERT INTO ${this.table} (id, state, created_at, updated_at) VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = EXCLUDED.updated_at`,
      [provider.id, provider, now, now],
    )
    return Ok(provider)
  }

  async update(provider: Provider) {
    const exists = await this.exists(provider.id)
    if (!exists.ok || !exists.value) return Err(new Error("Provider not found"))
    const now = Date.now()
    await this.pool.query(`UPDATE ${this.table} SET state=$2, updated_at=$3 WHERE id=$1`, [provider.id, provider, now])
    return Ok(provider)
  }

  async exists(id: string) {
    const { rows } = await this.pool.query(`SELECT 1 FROM ${this.table} WHERE id = $1 LIMIT 1`, [id])
    return Ok(rows.length > 0)
  }
}
