/**
 * Settings Domain - Error Codes
 *
 * Defines error codes for the Settings domain.
 */
export const SettingsErrorCode = {
  // Sort related
  SettingsInvalidSortOrder: "SETTINGS_INVALID_SORT_ORDER",
  SettingsInvalidOrderBy: "SETTINGS_INVALID_ORDER_BY",

  // Auto-save interval related
  SettingsAutoSaveIntervalTooShort: "SETTINGS_AUTO_SAVE_INTERVAL_TOO_SHORT",
  SettingsAutoSaveIntervalTooLong: "SETTINGS_AUTO_SAVE_INTERVAL_TOO_LONG",
} as const;

export type SettingsErrorCode =
  (typeof SettingsErrorCode)[keyof typeof SettingsErrorCode];
