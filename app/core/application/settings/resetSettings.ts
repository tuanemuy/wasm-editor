/**
 * Reset Settings Use Case
 *
 * Resets application settings to default values.
 */

import type { Settings } from "@/core/domain/settings/entity";
import { resetSettings as resetSettingsEntity } from "@/core/domain/settings/entity";
import type { Context } from "../context";

export async function resetSettings(context: Context): Promise<Settings> {
  // Reset to default settings
  const defaultSettings = resetSettingsEntity();

  // Save default settings
  await context.settingsRepository.save(defaultSettings);

  return defaultSettings;
}
