import { err, ok, type Result } from "neverthrow";
import type { Settings } from "@/core/domain/settings/entity";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export async function getSettings(
  context: Context,
): Promise<Result<Settings, ApplicationError>> {
  const result = await context.settingsRepository.get();

  if (result.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to get settings",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
