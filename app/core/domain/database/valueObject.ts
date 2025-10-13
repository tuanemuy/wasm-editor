import { BusinessRuleError } from "@/core/domain/error";
import { DatabaseErrorCode } from "./errorCode";

// DatabaseName
export type DatabaseName = string & { readonly brand: "DatabaseName" };

export function createDatabaseName(name: string): DatabaseName {
  if (!name || name.length === 0) {
    throw new BusinessRuleError(
      DatabaseErrorCode.InvalidDatabaseName,
      "Database name cannot be empty",
    );
  }

  const validExtensions = [".db", ".sqlite"];
  const hasValidExtension = validExtensions.some((ext) =>
    name.toLowerCase().endsWith(ext),
  );

  if (!hasValidExtension) {
    throw new BusinessRuleError(
      DatabaseErrorCode.InvalidDatabaseName,
      "Database name must have .db or .sqlite extension",
    );
  }

  return name as DatabaseName;
}

// DatabasePath
export type DatabasePath = string & { readonly brand: "DatabasePath" };

export function createDatabasePath(path: string): DatabasePath {
  if (!path || path.length === 0) {
    throw new BusinessRuleError(
      DatabaseErrorCode.InvalidDatabasePath,
      "Database path cannot be empty",
    );
  }

  return path as DatabasePath;
}

// Timestamp
export type Timestamp = Date & { readonly brand: "Timestamp" };

export function createTimestamp(date: Date): Timestamp {
  return date as Timestamp;
}

export function nowTimestamp(): Timestamp {
  return new Date() as Timestamp;
}

// DatabaseInfo
export type DatabaseInfo = {
  noteCount: number;
  tagCount: number;
  revisionCount: number;
  fileSize: number; // bytes
};
