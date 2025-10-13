export const DatabaseErrorCode = {
  InvalidDatabaseName: "INVALID_DATABASE_NAME",
  InvalidDatabasePath: "INVALID_DATABASE_PATH",
  DatabaseNotConnected: "DATABASE_NOT_CONNECTED",
} as const;
export type DatabaseErrorCode =
  (typeof DatabaseErrorCode)[keyof typeof DatabaseErrorCode];
