import { err, ok, type Result } from "neverthrow";
import type { DatabasePath } from "@/core/domain/database/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export async function getDatabasePath(
  context: Context,
): Promise<Result<DatabasePath | null, ApplicationError>> {
  const result = context.databaseManager.getConnection();

  if (result.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to get database connection",
        result.error,
      ),
    );
  }

  if (result.value === null) {
    return ok(null);
  }

  return ok(result.value.dbPath);
}
