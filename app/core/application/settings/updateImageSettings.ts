import type { Settings } from "@/core/domain/settings/entity";
import type { ImageSettings } from "@/core/domain/settings/valueObject";
import type { Context } from "../context";

export type UpdateImageSettingsInput = Partial<ImageSettings>;

export async function updateImageSettings(
  context: Context,
  input: UpdateImageSettingsInput,
): Promise<Settings> {
  // Get current settings
  const currentSettings = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.settingsRepository.get();
    },
  );

  // Update image settings
  const updatedImage = {
    ...currentSettings.image,
    ...input,
  };

  // Save via repository
  const savedSettings = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.settingsRepository.updateImage(updatedImage);
    },
  );

  return savedSettings;
}
