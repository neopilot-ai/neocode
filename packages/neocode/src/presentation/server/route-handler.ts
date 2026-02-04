import type { Request, Response } from "express"
import type { Container } from "@neocode-ai/application"

/**
 * Server Route Handler base class.
 * All server endpoints should extend this to get consistent error handling
 * and dependency access through the container.
 *
 * Pattern:
 * 1. Extend RouteHandler
 * 2. Implement handle() with HTTP logic
 * 3. Use this.container to access use cases
 * 4. Use this.success/error for consistent response format
 */
export abstract class RouteHandler {
  constructor(protected container: Container) {}

  /**
   * Handle the HTTP request and send response.
   */
  abstract handle(req: Request, res: Response): Promise<void>

  /**
   * Send success response (200)
   */
  protected success<T>(res: Response, data: T, statusCode: number = 200): void {
    res.status(statusCode).json({ ok: true, data })
  }

  /**
   * Send error response (400/500)
   */
  protected error(res: Response, error: Error | string, statusCode: number = 400): void {
    const message = typeof error === "string" ? error : error.message
    res.status(statusCode).json({ ok: false, error: message })
  }

  /**
   * Validate required fields in request body
   */
  protected validateRequired(body: any, fields: string[]): string | null {
    for (const field of fields) {
      if (!body[field]) {
        return `Missing required field: ${field}`
      }
    }
    return null
  }
}
