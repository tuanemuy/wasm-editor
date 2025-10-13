import { AnyError } from "@/lib/error";

export class ApplicationError extends AnyError {
  override readonly name: string = "ApplicationError";

  constructor(
    public readonly code: string,
    message: string,
    cause?: unknown,
  ) {
    super(message, cause);
  }
}

export const NotFoundErrorCode = {
  NotFound: "NOT_FOUND",
  // ${Entity}NotFound: "${ENTITY}_NOT_FOUND",
} as const;
export type NotFoundErrorCode =
  (typeof NotFoundErrorCode)[keyof typeof NotFoundErrorCode];

export class NotFoundError extends ApplicationError {
  override readonly name = "NotFoundError";

  constructor(
    public readonly code: NotFoundErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(code, message, cause);
  }
}

export const ConflictErrorCode = {
  Conflict: "CONFLICT",
  // ${Entity}Conflict: "${ENTITY}_CONFLICT",
} as const;
export type ConflictErrorCode =
  (typeof ConflictErrorCode)[keyof typeof ConflictErrorCode];

export class ConflictError extends ApplicationError {
  override readonly name = "ConflictError";

  constructor(
    public readonly code: ConflictErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(code, message, cause);
  }
}

export const UnauthenticatedErrorCode = {
  AuthenticationRequired: "AUTHENTICATION_REQUIRED",
  TokenExpired: "TOKEN_EXPIRED",
  InvalidToken: "INVALID_TOKEN",
} as const;
export type UnauthenticatedErrorCode =
  (typeof UnauthenticatedErrorCode)[keyof typeof UnauthenticatedErrorCode];

export class UnauthenticatedError extends ApplicationError {
  override readonly name = "UnauthenticatedError";

  constructor(
    public readonly code: UnauthenticatedErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(code, message, cause);
  }
}

export const ForbiddenErrorCode = {
  InsufficientPermissions: "INSUFFICIENT_PERMISSIONS",
} as const;
export type ForbiddenErrorCode =
  (typeof ForbiddenErrorCode)[keyof typeof ForbiddenErrorCode];

export class ForbiddenError extends ApplicationError {
  override readonly name = "ForbiddenError";

  constructor(
    public readonly code: ForbiddenErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(code, message, cause);
  }
}

export const ValidationErrorCode = {
  InvalidInput: "INVALID_INPUT",
} as const;
export type ValidationErrorCode =
  (typeof ValidationErrorCode)[keyof typeof ValidationErrorCode];

export class ValidationError extends ApplicationError {
  override readonly name = "ValidationError";

  constructor(
    public readonly code: ValidationErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(code, message, cause);
  }
}

export const SystemErrorCode = {
  InternalServerError: "INTERNAL_SERVER_ERROR",
  DatabaseError: "DATABASE_ERROR",
  NetworkError: "NETWORK_ERROR",
} as const;
export type SystemErrorCode =
  (typeof SystemErrorCode)[keyof typeof SystemErrorCode];

export class SystemError extends ApplicationError {
  override readonly name = "SystemError";

  constructor(
    public readonly code: SystemErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(code, message, cause);
  }
}
