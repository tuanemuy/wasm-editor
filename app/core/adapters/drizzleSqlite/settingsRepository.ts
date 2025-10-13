import { eq } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import {
  createDefaultSettings,
  reconstructSettings,
  type Settings,
} from "@/core/domain/settings/entity";
import type { SettingsRepository } from "@/core/domain/settings/ports/settingsRepository";
import { RepositoryError } from "@/core/error/adapter";
import type { Executor } from "./client";
import { settings } from "./schema";

export class DrizzleSqliteSettingsRepository implements SettingsRepository {
  constructor(private readonly executor: Executor) {}

  async get(): Promise<Result<Settings, RepositoryError>> {
    try {
      const result = await this.executor
        .select()
        .from(settings)
        .where(eq(settings.id, 1))
        .limit(1);

      // If settings don't exist, create and return default settings
      if (result.length === 0) {
        const defaultSettings = createDefaultSettings();
        await this.executor.insert(settings).values({
          id: 1,
          defaultSortBy: defaultSettings.defaultSortBy,
          autoSaveInterval: defaultSettings.autoSaveInterval,
          revisionInterval: defaultSettings.revisionInterval,
          editorFontSize: defaultSettings.editorFontSize,
          editorTheme: defaultSettings.editorTheme,
          updatedAt: defaultSettings.updatedAt,
        });
        return ok(defaultSettings);
      }

      return reconstructSettings({
        defaultSortBy: result[0].defaultSortBy,
        autoSaveInterval: result[0].autoSaveInterval,
        revisionInterval: result[0].revisionInterval,
        editorFontSize: result[0].editorFontSize,
        editorTheme: result[0].editorTheme,
        updatedAt: result[0].updatedAt,
      }).mapErr((error) => new RepositoryError("Invalid settings data", error));
    } catch (error) {
      return err(new RepositoryError("Failed to get settings", error));
    }
  }

  async update(
    settingsData: Settings,
  ): Promise<Result<Settings, RepositoryError>> {
    try {
      // Ensure the settings row exists first
      const existing = await this.executor
        .select()
        .from(settings)
        .where(eq(settings.id, 1))
        .limit(1);

      if (existing.length === 0) {
        // Insert if not exists
        await this.executor.insert(settings).values({
          id: 1,
          defaultSortBy: settingsData.defaultSortBy,
          autoSaveInterval: settingsData.autoSaveInterval,
          revisionInterval: settingsData.revisionInterval,
          editorFontSize: settingsData.editorFontSize,
          editorTheme: settingsData.editorTheme,
          updatedAt: settingsData.updatedAt,
        });
      } else {
        // Update if exists
        await this.executor
          .update(settings)
          .set({
            defaultSortBy: settingsData.defaultSortBy,
            autoSaveInterval: settingsData.autoSaveInterval,
            revisionInterval: settingsData.revisionInterval,
            editorFontSize: settingsData.editorFontSize,
            editorTheme: settingsData.editorTheme,
            updatedAt: settingsData.updatedAt,
          })
          .where(eq(settings.id, 1));
      }

      return ok(settingsData);
    } catch (error) {
      return err(new RepositoryError("Failed to update settings", error));
    }
  }
}
