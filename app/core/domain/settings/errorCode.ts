/**
 * Settings Domain - Error Codes
 *
 * Defines error codes for the Settings domain.
 */
export const SettingsErrorCode = {
  // Sort related
  InvalidSortOrder: "SETTINGS_INVALID_SORT_ORDER",
  InvalidOrderBy: "SETTINGS_INVALID_ORDER_BY",

  // Auto-save interval related
  AutoSaveIntervalTooShort: "SETTINGS_AUTO_SAVE_INTERVAL_TOO_SHORT",
  AutoSaveIntervalTooLong: "SETTINGS_AUTO_SAVE_INTERVAL_TOO_LONG",
} as const;

export type SettingsErrorCode =
  (typeof SettingsErrorCode)[keyof typeof SettingsErrorCode];
