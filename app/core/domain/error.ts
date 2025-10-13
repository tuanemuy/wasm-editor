/**
 * Domain Layer - Business Rule Error
 *
 * Represents a violation of business rules in the domain layer.
 * This error is thrown when domain logic determines that an operation cannot proceed.
 */
export class BusinessRuleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "BusinessRuleError";

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BusinessRuleError);
    }
  }
}
