import { err, ok, type Result } from "neverthrow";
import type { DatabaseConnection } from "@/core/domain/database/entity";
import type { DatabasePath } from "@/core/domain/database/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type ChangeDatabasePathInput = {
  newDbPath: DatabasePath;
};

export async function changeDatabasePath(
  context: Context,
  input: ChangeDatabasePathInput,
): Promise<Result<DatabaseConnection, ApplicationError>> {
  // Close current database if open
  if (context.databaseManager.isOpen()) {
    const closeResult = await context.databaseManager.close();

    if (closeResult.isErr()) {
      return err(
        new ApplicationError(
          ApplicationErrorCode.INTERNAL_SERVER_ERROR,
          "Failed to close current database",
          closeResult.error,
        ),
      );
    }
  }

  // Open database at new path
  const result = await context.databaseManager.open(input.newDbPath);

  if (result.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to open database at new path",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
