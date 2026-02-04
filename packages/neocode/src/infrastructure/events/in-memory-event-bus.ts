import type { IEventBus } from "@neocode-ai/ports/event-bus"

export class InMemoryEventBus implements IEventBus {
  private handlers: Record<string, Array<(payload: any) => Promise<void>>> = {}
  async publish(event: any): Promise<void> {
    const handlers = this.handlers[event.type] ?? []
    await Promise.all(handlers.map((h) => h(event)))
  }
  async subscribe(eventType: string, handler: (payload: any) => Promise<void>): Promise<void> {
    this.handlers[eventType] = this.handlers[eventType] ?? []
    this.handlers[eventType].push(handler)
  }
  async unsubscribe(eventType: string): Promise<void> {
    delete this.handlers[eventType]
  }
}
