import type { Result } from "neverthrow";
import * as z from "zod";
import { type ValidationError, validate } from "@/lib/validation";
import { type DatabasePath, databasePathSchema } from "./valueObject";

/**
 * Database connection entity
 */
export type DatabaseConnection = Readonly<{
  dbPath: DatabasePath;
  isOpen: boolean;
  createdAt: Date;
}>;

/**
 * Parameters for creating a new database connection
 */
export type CreateDatabaseConnectionParams = {
  dbPath: DatabasePath;
  isOpen: boolean;
};

/**
 * Raw database connection data
 */
export type RawDatabaseConnectionData = {
  dbPath: string;
  isOpen: boolean;
  createdAt: Date;
};

/**
 * Create a new database connection
 */
export function createDatabaseConnection(
  params: CreateDatabaseConnectionParams,
): Result<DatabaseConnection, ValidationError> {
  return validate(
    z.object({
      dbPath: databasePathSchema,
      isOpen: z.boolean(),
    }),
    params,
  ).map((validated) => {
    return {
      dbPath: validated.dbPath,
      isOpen: validated.isOpen,
      createdAt: new Date(),
    } satisfies DatabaseConnection;
  });
}

/**
 * Reconstruct database connection from raw data
 */
export function reconstructDatabaseConnection(
  data: RawDatabaseConnectionData,
): Result<DatabaseConnection, ValidationError> {
  return validate(
    z.object({
      dbPath: databasePathSchema,
      isOpen: z.boolean(),
      createdAt: z.date(),
    }),
    data,
  );
}
