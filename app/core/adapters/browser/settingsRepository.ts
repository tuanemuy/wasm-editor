/**
 * Browser Settings Repository Adapter
 *
 * Implements SettingsRepository using browser localStorage.
 * Stores settings as a JSON object in localStorage.
 */
import { SystemError, SystemErrorCode } from "@/core/application/error";
import { createOrderBy, createSortOrder } from "@/core/domain/note/valueObject";
import type { Settings } from "@/core/domain/settings/entity";
import { DEFAULT_SETTINGS } from "@/core/domain/settings/entity";
import type { SettingsRepository } from "@/core/domain/settings/ports/settingsRepository";
import { createAutoSaveInterval } from "@/core/domain/settings/valueObject";

const STORAGE_KEY = "app_settings";

/**
 * Settings data model for localStorage
 */
type SettingsDataModel = {
  defaultOrder: string;
  defaultOrderBy: string;
  autoSaveInterval: number;
};

export class BrowserSettingsRepository implements SettingsRepository {
  /**
   * Convert domain entity to data model
   */
  private from(settings: Settings): SettingsDataModel {
    return {
      defaultOrder: settings.defaultOrder,
      defaultOrderBy: settings.defaultOrderBy,
      autoSaveInterval: settings.autoSaveInterval,
    };
  }

  /**
   * Convert data model to domain entity
   */
  private into(data: SettingsDataModel): Settings {
    return {
      defaultOrder: createSortOrder(data.defaultOrder),
      defaultOrderBy: createOrderBy(data.defaultOrderBy),
      autoSaveInterval: createAutoSaveInterval(data.autoSaveInterval),
    };
  }

  async get(): Promise<Settings> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);

      if (!data) {
        // Return default settings if not found
        return { ...DEFAULT_SETTINGS };
      }

      const parsed = JSON.parse(data) as SettingsDataModel;
      return this.into(parsed);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to get settings from localStorage",
        error,
      );
    }
  }

  async save(settings: Settings): Promise<void> {
    try {
      const data = this.from(settings);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to save settings to localStorage",
        error,
      );
    }
  }

  async exists(): Promise<boolean> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data !== null;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to check settings existence in localStorage",
        error,
      );
    }
  }
}
