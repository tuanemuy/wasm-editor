/**
 * Settings Domain - Value Objects
 *
 * Defines value objects for the Settings domain with business rule validation.
 *
 * Note: SortOrder and OrderBy are defined in Note domain and imported here.
 */
import { BusinessRuleError } from "@/core/domain/error";
import { SettingsErrorCode } from "./errorCode";

const AUTO_SAVE_INTERVAL_MIN = 500;
const AUTO_SAVE_INTERVAL_MAX = 10000;
const AUTO_SAVE_INTERVAL_DEFAULT = 2000;

// ============================================================================
// AutoSaveInterval
// ============================================================================

export type AutoSaveInterval = number & { readonly brand: "AutoSaveInterval" };

/**
 * Create AutoSaveInterval with validation
 *
 * Business Rules:
 * - Minimum: 500 milliseconds
 * - Maximum: 10000 milliseconds (10 seconds)
 * - Must be a positive number
 *
 * @throws {BusinessRuleError} If validation fails
 */
export function createAutoSaveInterval(interval: number): AutoSaveInterval {
  if (interval < AUTO_SAVE_INTERVAL_MIN) {
    throw new BusinessRuleError(
      SettingsErrorCode.AutoSaveIntervalTooShort,
      `Auto-save interval must be at least ${AUTO_SAVE_INTERVAL_MIN} milliseconds`,
    );
  }

  if (interval > AUTO_SAVE_INTERVAL_MAX) {
    throw new BusinessRuleError(
      SettingsErrorCode.AutoSaveIntervalTooLong,
      `Auto-save interval must not exceed ${AUTO_SAVE_INTERVAL_MAX} milliseconds`,
    );
  }

  return interval as AutoSaveInterval;
}

/**
 * Get default auto-save interval (2000ms)
 */
export function getDefaultAutoSaveInterval(): AutoSaveInterval {
  return AUTO_SAVE_INTERVAL_DEFAULT as AutoSaveInterval;
}
