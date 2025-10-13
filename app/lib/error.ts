export class AnyError extends Error {
  override readonly name: string = "AnyError";
  override readonly cause?: AnyError;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = fromUnknown(cause);
  }
}

export function isAnyError(error: unknown): error is AnyError {
  return error instanceof AnyError;
}

export function fromUnknown(error: unknown): AnyError {
  if (error instanceof Error) {
    return new AnyError(error.message, error);
  }

  if (typeof error === "string") {
    return new AnyError(error);
  }

  return new AnyError("Unknown error occurred", error);
}
