export class AnyError extends Error {
  override readonly name: string = "AnyError";
  override readonly cause?: Error;

  constructor(message: string, cause?: unknown) {
    super(message);
    // Store the original cause without wrapping to avoid infinite recursion
    if (cause instanceof Error) {
      this.cause = cause;
    } else if (cause !== undefined) {
      // Convert non-Error causes to Error for the cause property
      this.cause = new Error(String(cause));
    }
  }
}

export function isAnyError(error: unknown): error is AnyError {
  return error instanceof AnyError;
}

export function fromUnknown(error: unknown): AnyError {
  // If already an AnyError, return as-is
  if (error instanceof AnyError) {
    return error;
  }

  if (error instanceof Error) {
    return new AnyError(error.message, error);
  }

  if (typeof error === "string") {
    return new AnyError(error);
  }

  return new AnyError("Unknown error occurred", error);
}
