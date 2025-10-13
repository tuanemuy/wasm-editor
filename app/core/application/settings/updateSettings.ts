import type { Settings } from "@/core/domain/settings/entity";
import { updateSettings as updateSettingsEntity } from "@/core/domain/settings/entity";
import type { Context } from "../context";

export type UpdateSettingsInput = Partial<Settings>;

export async function updateSettings(
  context: Context,
  input: UpdateSettingsInput,
): Promise<Settings> {
  // Get current settings
  const currentSettings = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.settingsRepository.get();
    },
  );

  // Update settings
  const updatedSettings = updateSettingsEntity(currentSettings, input);

  // Save settings
  const savedSettings = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.settingsRepository.save(updatedSettings);
    },
  );

  return savedSettings;
}
