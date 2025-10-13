import type { Settings } from "@/core/domain/settings/entity";
import type { GeneralSettings } from "@/core/domain/settings/valueObject";
import type { Context } from "../context";

export type UpdateGeneralSettingsInput = Partial<GeneralSettings>;

export async function updateGeneralSettings(
  context: Context,
  input: UpdateGeneralSettingsInput,
): Promise<Settings> {
  // Get current settings
  const currentSettings = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.settingsRepository.get();
    },
  );

  // Update general settings
  const updatedGeneral = {
    ...currentSettings.general,
    ...input,
  };

  // Save via repository
  const savedSettings = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.settingsRepository.updateGeneral(
        updatedGeneral,
      );
    },
  );

  return savedSettings;
}
