import type { Settings } from "@/core/domain/settings/entity";
import type { EditorSettings } from "@/core/domain/settings/valueObject";
import type { Context } from "../context";

export type UpdateEditorSettingsInput = Partial<EditorSettings>;

export async function updateEditorSettings(
  context: Context,
  input: UpdateEditorSettingsInput,
): Promise<Settings> {
  // Get current settings
  const currentSettings = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.settingsRepository.get();
    },
  );

  // Update editor settings
  const updatedEditor = {
    ...currentSettings.editor,
    ...input,
  };

  // Save via repository
  const savedSettings = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.settingsRepository.updateEditor(updatedEditor);
    },
  );

  return savedSettings;
}
