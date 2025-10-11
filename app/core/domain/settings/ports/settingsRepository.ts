import type { Result } from "neverthrow";
import type { RepositoryError } from "@/core/error/adapter";
import type { Settings } from "../entity";

/**
 * Settings repository interface
 * Settings are stored as a singleton (only one row in the database)
 */
export interface SettingsRepository {
  /**
   * Get settings (returns default settings if none exist)
   */
  get(): Promise<Result<Settings, RepositoryError>>;

  /**
   * Update settings
   */
  update(settings: Settings): Promise<Result<Settings, RepositoryError>>;
}
