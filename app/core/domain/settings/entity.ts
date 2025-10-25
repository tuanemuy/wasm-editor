/**
 * Settings Domain - Entity
 *
 * Settings represents application-wide configuration.
 * There is only one Settings instance per application (singleton pattern enforced at repository layer).
 */
import type { OrderBy, SortOrder } from "@/core/domain/note/valueObject";
import {
  createOrderBy,
  createSortOrder,
  getDefaultOrderBy,
  getDefaultSortOrder,
} from "@/core/domain/note/valueObject";
import {
  type AutoSaveInterval,
  createAutoSaveInterval,
  getDefaultAutoSaveInterval,
} from "./valueObject";

// ============================================================================
// Settings Entity
// ============================================================================

export type Settings = Readonly<{
  defaultOrder: SortOrder;
  defaultOrderBy: OrderBy;
  autoSaveInterval: AutoSaveInterval;
}>;

// ============================================================================
// Default Settings
// ============================================================================

/**
 * Default settings values
 */
export const DEFAULT_SETTINGS: Settings = {
  defaultOrder: getDefaultSortOrder(),
  defaultOrderBy: getDefaultOrderBy(),
  autoSaveInterval: getDefaultAutoSaveInterval(),
};

// ============================================================================
// Entity Operations
// ============================================================================

/**
 * Create default settings
 *
 * Note: This creates a new instance with default values,
 * not a singleton. The singleton pattern is enforced at the repository layer.
 */
export function createDefaultSettings(): Settings {
  return { ...DEFAULT_SETTINGS };
}

/**
 * Update settings (partial update)
 *
 * Business Rules:
 * - Only specified fields are updated
 * - Unspecified fields retain their current values
 * - All values are validated
 *
 * @throws {BusinessRuleError} If validation fails
 */
export function updateSettings(
  settings: Settings,
  updates: Partial<{
    defaultOrder: string;
    defaultOrderBy: string;
    autoSaveInterval: number;
  }>,
): Settings {
  return {
    defaultOrder:
      updates.defaultOrder !== undefined
        ? createSortOrder(updates.defaultOrder)
        : settings.defaultOrder,
    defaultOrderBy:
      updates.defaultOrderBy !== undefined
        ? createOrderBy(updates.defaultOrderBy)
        : settings.defaultOrderBy,
    autoSaveInterval:
      updates.autoSaveInterval !== undefined
        ? createAutoSaveInterval(updates.autoSaveInterval)
        : settings.autoSaveInterval,
  };
}

/**
 * Reset settings to default values
 */
export function resetSettings(): Settings {
  return createDefaultSettings();
}
