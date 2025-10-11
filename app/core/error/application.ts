import { AnyError } from "@/lib/error";

/**
 * Base error class for application layer errors
 */
export class ApplicationError extends AnyError {
  override readonly name = "ApplicationError";

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}
