import { err, ok, type Result } from "neverthrow";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export async function closeDatabase(
  context: Context,
): Promise<Result<void, ApplicationError>> {
  const result = await context.databaseManager.close();

  if (result.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to close database",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
