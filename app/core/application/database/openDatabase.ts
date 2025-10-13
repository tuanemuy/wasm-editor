import { err, ok, type Result } from "neverthrow";
import type { DatabaseConnection } from "@/core/domain/database/entity";
import type { DatabasePath } from "@/core/domain/database/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type OpenDatabaseInput = {
  dbPath?: DatabasePath;
};

export async function openDatabase(
  context: Context,
  input: OpenDatabaseInput,
): Promise<Result<DatabaseConnection, ApplicationError>> {
  // If no path is provided, open file dialog
  if (!input.dbPath) {
    const fileResult = await context.databaseStorageManager.openWithDialog();

    if (fileResult.isErr()) {
      return err(
        new ApplicationError(
          ApplicationErrorCode.INTERNAL_SERVER_ERROR,
          "Failed to open file dialog",
          fileResult.error,
        ),
      );
    }

    // Use the file name as the path
    const dbPath = fileResult.value.name;
    const result = await context.databaseManager.open(dbPath);

    if (result.isErr()) {
      return err(
        new ApplicationError(
          ApplicationErrorCode.INTERNAL_SERVER_ERROR,
          "Failed to open database",
          result.error,
        ),
      );
    }

    return ok(result.value);
  }

  // Open database with provided path
  const result = await context.databaseManager.open(input.dbPath);

  if (result.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to open database",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
