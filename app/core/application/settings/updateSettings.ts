/**
 * Update Settings Use Case
 *
 * Updates application settings with provided values.
 * Only specified fields are updated; unspecified fields retain their current values.
 */

import type { Settings } from "@/core/domain/settings/entity";
import { updateSettings as updateSettingsEntity } from "@/core/domain/settings/entity";
import type { Context } from "../context";

export type UpdateSettingsInput = {
  defaultOrder?: string;
  defaultOrderBy?: string;
  autoSaveInterval?: number;
};

export async function updateSettings(
  context: Context,
  input: UpdateSettingsInput,
): Promise<Settings> {
  // Get current settings
  const currentSettings = await context.settingsRepository.get();

  // Update settings (validates values)
  const updatedSettings = updateSettingsEntity(currentSettings, input);

  // Save updated settings
  await context.settingsRepository.save(updatedSettings);

  return updatedSettings;
}
