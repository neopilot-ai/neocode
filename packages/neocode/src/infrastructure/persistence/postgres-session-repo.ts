import { Pool } from "pg"
import type { ISessionRepository } from "@neocode-ai/ports/persistence"
import type { SessionAggregateRoot } from "@neocode-ai/domain/session"
import { Ok, Err } from "@neocode-ai/shared/types/result"

export class PostgresSessionRepository implements ISessionRepository {
  private pool: Pool
  private table = "sessions"

  constructor(pool: Pool) {
    this.pool = pool
  }

  async init(): Promise<void> {
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.table} (
        id TEXT PRIMARY KEY,
        project_path TEXT NOT NULL,
        state JSONB NOT NULL,
        created_at BIGINT NOT NULL,
        updated_at BIGINT NOT NULL
      );
    `
    await this.pool.query(sql)
  }

  async findById(id: string) {
    const { rows } = await this.pool.query(`SELECT state FROM ${this.table} WHERE id = $1`, [id])
    if (rows.length === 0) return Err(new Error("Session not found"))
    return Ok(rows[0].state as SessionAggregateRoot)
  }

  async save(state: SessionAggregateRoot) {
    const now = Date.now()
    await this.pool.query(
      `INSERT INTO ${this.table} (id, project_path, state, created_at, updated_at) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = EXCLUDED.updated_at`,
      [state.id, state.projectPath, state, now, now],
    )
    return Ok(state)
  }

  async update(state: SessionAggregateRoot) {
    const exists = await this.exists(state.id)
    if (!exists.ok || !exists.value) return Err(new Error("Session not found"))
    const now = Date.now()
    await this.pool.query(`UPDATE ${this.table} SET state=$2, updated_at=$3 WHERE id=$1`, [state.id, state, now])
    return Ok(state)
  }

  async delete(id: string) {
    await this.pool.query(`DELETE FROM ${this.table} WHERE id = $1`, [id])
    return Ok(undefined)
  }

  async listByProject(projectPath: string) {
    const { rows } = await this.pool.query(`SELECT state FROM ${this.table} WHERE project_path = $1`, [projectPath])
    return Ok(rows.map((r) => r.state as SessionAggregateRoot))
  }

  async exists(id: string) {
    const { rows } = await this.pool.query(`SELECT 1 FROM ${this.table} WHERE id = $1 LIMIT 1`, [id])
    return Ok(rows.length > 0)
  }
}
