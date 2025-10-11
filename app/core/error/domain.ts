import { AnyError } from "@/lib/error";

/**
 * Base error class for domain layer errors
 */
export class DomainError extends AnyError {
  override readonly name = "DomainError";

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}
