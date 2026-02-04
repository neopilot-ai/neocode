/**
 * Named error for domain-specific errors
 */
export class NamedError extends Error {
  constructor(
    public override name: string,
    message?: string,
    public metadata: Record<string, unknown> = {},
  ) {
    super(message)
    Object.setPrototypeOf(this, NamedError.prototype)
  }

  toObject() {
    return {
      name: this.name,
      message: this.message,
      metadata: this.metadata,
    }
  }
}

/**
 * Common domain errors
 */
export class ValidationError extends NamedError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super("ValidationError", message, metadata)
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class NotFoundError extends NamedError {
  constructor(resourceType: string, id: string) {
    super("NotFoundError", `${resourceType} not found: ${id}`, { resourceType, id })
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

export class UnauthorizedError extends NamedError {
  constructor(message = "Unauthorized", metadata?: Record<string, unknown>) {
    super("UnauthorizedError", message, metadata)
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}

export class ForbiddenError extends NamedError {
  constructor(message = "Forbidden", metadata?: Record<string, unknown>) {
    super("ForbiddenError", message, metadata)
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}

export class ConflictError extends NamedError {
  constructor(message: string, metadata?: Record<string, unknown>) {
    super("ConflictError", message, metadata)
    Object.setPrototypeOf(this, ConflictError.prototype)
  }
}
