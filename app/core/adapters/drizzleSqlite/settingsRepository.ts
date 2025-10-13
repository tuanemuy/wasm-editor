import type { InferSelectModel } from "drizzle-orm";
import { eq } from "drizzle-orm";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import {
  createDefaultSettings,
  type Settings,
} from "@/core/domain/settings/entity";
import type { SettingsRepository } from "@/core/domain/settings/ports/settingsRepository";
import type {
  EditorSettings,
  GeneralSettings,
  ImageSettings,
  RevisionSettings,
  Timestamp,
} from "@/core/domain/settings/valueObject";
import type { Executor } from "./client";
import { settings } from "./schema";

type SettingsDataModel = InferSelectModel<typeof settings>;

const SETTINGS_ID = "default";

export class DrizzleSqliteSettingsRepository implements SettingsRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: SettingsDataModel): Settings {
    return {
      general: data.general as unknown as GeneralSettings,
      editor: data.editor as unknown as EditorSettings,
      revision: data.revision as unknown as RevisionSettings,
      image: data.image as unknown as ImageSettings,
      updatedAt: data.updatedAt as Timestamp,
    };
  }

  async get(): Promise<Settings> {
    try {
      const result = await this.executor
        .select()
        .from(settings)
        .where(eq(settings.id, SETTINGS_ID))
        .limit(1);

      if (result.length === 0) {
        // If settings don't exist, create default settings
        const defaultSettings = createDefaultSettings();
        await this.save(defaultSettings);
        return defaultSettings;
      }

      return this.into(result[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to get settings",
        error,
      );
    }
  }

  async save(settingsData: Settings): Promise<Settings> {
    try {
      await this.executor
        .insert(settings)
        .values({
          id: SETTINGS_ID,
          general: settingsData.general as unknown as string,
          editor: settingsData.editor as unknown as string,
          revision: settingsData.revision as unknown as string,
          image: settingsData.image as unknown as string,
          updatedAt: new Date(settingsData.updatedAt),
        })
        .onConflictDoUpdate({
          target: settings.id,
          set: {
            general: settingsData.general as unknown as string,
            editor: settingsData.editor as unknown as string,
            revision: settingsData.revision as unknown as string,
            image: settingsData.image as unknown as string,
            updatedAt: new Date(settingsData.updatedAt),
          },
        });

      return settingsData;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save settings",
        error,
      );
    }
  }

  async reset(): Promise<Settings> {
    try {
      const defaultSettings = createDefaultSettings();
      return await this.save(defaultSettings);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to reset settings",
        error,
      );
    }
  }

  async updateGeneral(general: GeneralSettings): Promise<Settings> {
    try {
      const currentSettings = await this.get();
      const updatedSettings: Settings = {
        ...currentSettings,
        general,
        updatedAt: new Date() as Timestamp,
      };
      return await this.save(updatedSettings);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to update general settings",
        error,
      );
    }
  }

  async updateEditor(editor: EditorSettings): Promise<Settings> {
    try {
      const currentSettings = await this.get();
      const updatedSettings: Settings = {
        ...currentSettings,
        editor,
        updatedAt: new Date() as Timestamp,
      };
      return await this.save(updatedSettings);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to update editor settings",
        error,
      );
    }
  }

  async updateRevision(revision: RevisionSettings): Promise<Settings> {
    try {
      const currentSettings = await this.get();
      const updatedSettings: Settings = {
        ...currentSettings,
        revision,
        updatedAt: new Date() as Timestamp,
      };
      return await this.save(updatedSettings);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to update revision settings",
        error,
      );
    }
  }

  async updateImage(image: ImageSettings): Promise<Settings> {
    try {
      const currentSettings = await this.get();
      const updatedSettings: Settings = {
        ...currentSettings,
        image,
        updatedAt: new Date() as Timestamp,
      };
      return await this.save(updatedSettings);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to update image settings",
        error,
      );
    }
  }
}
