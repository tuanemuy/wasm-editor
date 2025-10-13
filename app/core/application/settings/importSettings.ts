import type { Settings } from "@/core/domain/settings/entity";
import type { Context } from "../context";
import { ValidationError, ValidationErrorCode } from "../error";

export type ImportSettingsInput = {
  json: string;
};

export async function importSettings(
  context: Context,
  input: ImportSettingsInput,
): Promise<Settings> {
  // Parse JSON
  let parsedSettings: unknown;
  try {
    parsedSettings = JSON.parse(input.json);
  } catch (error) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Invalid JSON format",
      error,
    );
  }

  // Validate and create settings
  // Note: createSettings should handle validation
  let settings: Settings;
  try {
    settings = parsedSettings as Settings;
    // Additional validation can be added here if needed
  } catch (error) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      "Invalid settings format",
      error,
    );
  }

  // Save settings
  const savedSettings = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.settingsRepository.save(settings);
    },
  );

  return savedSettings;
}
