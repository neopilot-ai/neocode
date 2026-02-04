import amqplib from "amqplib"
import type { IEventBus } from "@neocode-ai/ports/event-bus"

export class RabbitMQEventBus implements IEventBus {
  private conn?: amqplib.Connection
  private channel?: amqplib.Channel
  private exchange = "neocode.events"

  constructor(private url: string) {}

  private async ensure() {
    if (this.channel && this.conn) return
    this.conn = await amqplib.connect(this.url)
    this.channel = await this.conn.createChannel()
    await this.channel.assertExchange(this.exchange, "topic", { durable: true })
  }

  async publish(event: any): Promise<void> {
    await this.ensure()
    const payload = Buffer.from(JSON.stringify(event))
    const key = event.type || "unknown"
    this.channel!.publish(this.exchange, key, payload)
  }

  async subscribe(eventType: string, handler: (payload: any) => Promise<void>): Promise<void> {
    await this.ensure()
    const q = await this.channel!.assertQueue("", { exclusive: true })
    await this.channel!.bindQueue(q.queue, this.exchange, eventType)
    await this.channel!.consume(q.queue, async (msg) => {
      if (!msg) return
      try {
        const parsed = JSON.parse(msg.content.toString())
        await handler(parsed)
        this.channel!.ack(msg)
      } catch (err) {
        this.channel!.nack(msg, false, false)
      }
    })
  }

  async unsubscribe(_eventType: string): Promise<void> {
    // Not implemented: consumer cancellation requires storing consumer tags
    return
  }
}
