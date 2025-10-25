/**
 * Get Settings Use Case
 *
 * Retrieves current application settings.
 * Returns default settings if none exist.
 */
import type { Settings } from "@/core/domain/settings/entity";
import type { Context } from "../context";

export async function getSettings(context: Context): Promise<Settings> {
  return await context.settingsRepository.get();
}
