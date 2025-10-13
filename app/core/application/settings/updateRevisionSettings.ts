import type { Settings } from "@/core/domain/settings/entity";
import type { RevisionSettings } from "@/core/domain/settings/valueObject";
import type { Context } from "../context";

export type UpdateRevisionSettingsInput = Partial<RevisionSettings>;

export async function updateRevisionSettings(
  context: Context,
  input: UpdateRevisionSettingsInput,
): Promise<Settings> {
  // Get current settings
  const currentSettings = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.settingsRepository.get();
    },
  );

  // Update revision settings
  const updatedRevision = {
    ...currentSettings.revision,
    ...input,
  };

  // Save via repository
  const savedSettings = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.settingsRepository.updateRevision(
        updatedRevision,
      );
    },
  );

  return savedSettings;
}
