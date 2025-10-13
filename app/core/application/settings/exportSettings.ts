import type { Context } from "../context";
import { SystemError, SystemErrorCode } from "../error";

export async function exportSettings(context: Context): Promise<string> {
  // Get current settings
  const settings = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.settingsRepository.get();
    },
  );

  // Serialize to JSON
  try {
    const json = JSON.stringify(settings, null, 2);
    return json;
  } catch (error) {
    throw new SystemError(
      SystemErrorCode.InternalServerError,
      "Failed to serialize settings",
      error,
    );
  }
}
