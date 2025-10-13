import type { Settings } from "@/core/domain/settings/entity";
import type { Context } from "../context";

export async function resetSettings(context: Context): Promise<Settings> {
  const settings = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.settingsRepository.reset();
    },
  );

  return settings;
}
