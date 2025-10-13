import { err, ok, type Result } from "neverthrow";
import type { DatabaseConnection } from "@/core/domain/database/entity";
import type { DatabasePath } from "@/core/domain/database/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type CreateDatabaseInput = {
  dbPath: DatabasePath;
};

export async function createDatabase(
  context: Context,
  input: CreateDatabaseInput,
): Promise<Result<DatabaseConnection, ApplicationError>> {
  const result = await context.databaseManager.create(input.dbPath);

  if (result.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to create database",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
