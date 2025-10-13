import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import type { Settings, SettingsUpdates } from "@/core/domain/settings/entity";
import { updateSettings as updateSettingsEntity } from "@/core/domain/settings/entity";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type UpdateSettingsInput = SettingsUpdates;

export async function updateSettings(
  context: Context,
  input: UpdateSettingsInput,
): Promise<Result<Settings, ApplicationError>> {
  // Get current settings
  const settingsResult = await context.settingsRepository.get();

  if (settingsResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to update settings",
        settingsResult.error,
      ),
    );
  }

  // Update settings
  const updatedSettingsResult = updateSettingsEntity(
    settingsResult.value,
    input,
  );

  if (updatedSettingsResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to update settings",
        updatedSettingsResult.error,
      ),
    );
  }

  const updateResult = await context.settingsRepository.update(
    updatedSettingsResult.value,
  );

  if (updateResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to update settings",
        updateResult.error,
      ),
    );
  }

  return ok(updateResult.value);
}
