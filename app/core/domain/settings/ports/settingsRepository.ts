/**
 * Settings Domain - Repository Port
 *
 * Defines the interface for Settings persistence.
 *
 * Implementation Constraints:
 * - The system maintains only one Settings instance (singleton)
 * - This constraint is enforced at the repository implementation layer (e.g., localStorage)
 */
import type { Settings } from "../entity";

export interface SettingsRepository {
  /**
   * Get settings
   *
   * Returns the single Settings instance for the entire system.
   * If settings do not exist, returns default settings.
   *
   * @returns Settings instance
   * @throws {SystemError} If get operation fails
   */
  get(): Promise<Settings>;

  /**
   * Save settings
   *
   * Updates the single Settings instance for the entire system.
   *
   * @param settings - Settings to save
   * @throws {SystemError} If save operation fails
   */
  save(settings: Settings): Promise<void>;

  /**
   * Check if settings exist
   *
   * @returns True if settings exist, false otherwise
   * @throws {SystemError} If check operation fails
   */
  exists(): Promise<boolean>;
}
