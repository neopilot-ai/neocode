import type { ISessionRepository } from "@neocode-ai/ports/persistence"
import type { SessionAggregateRoot } from "@neocode-ai/domain/session"
import { Ok, Err } from "@neocode-ai/shared/types/result"

export class InMemorySessionRepository implements ISessionRepository {
  private store = new Map<string, SessionAggregateRoot>()

  async findById(id: string) {
    const v = this.store.get(id)
    if (!v) return Err(new Error("Session not found"))
    return Ok(v)
  }

  async save(state: SessionAggregateRoot) {
    this.store.set(state.id, state)
    return Ok(state)
  }

  async update(state: SessionAggregateRoot) {
    if (!this.store.has(state.id)) return Err(new Error("Session not found"))
    this.store.set(state.id, state)
    return Ok(state)
  }

  async delete(id: string) {
    this.store.delete(id)
    return Ok(undefined)
  }

  async listByProject(projectPath: string) {
    const items = Array.from(this.store.values()).filter((s) => s.projectPath === projectPath)
    return Ok(items)
  }

  async exists(id: string) {
    return Ok(this.store.has(id))
  }
}
