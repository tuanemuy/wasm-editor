import { AnyError } from "@/lib/error";

/**
 * Base error class for adapter layer errors
 */
export class AdapterError extends AnyError {
  override readonly name: string = "AdapterError";

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

/**
 * Error for repository operations
 */
export class RepositoryError extends AdapterError {
  override readonly name: string = "RepositoryError";

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}

/**
 * Error for external service operations (File System API, etc.)
 */
export class ExternalServiceError extends AdapterError {
  override readonly name: string = "ExternalServiceError";

  constructor(message: string, cause?: unknown) {
    super(message, cause);
  }
}
