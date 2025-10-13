export const SettingsErrorCode = {
  InvalidAutoSaveInterval: "INVALID_AUTO_SAVE_INTERVAL",
  InvalidItemsPerPage: "INVALID_ITEMS_PER_PAGE",
  InvalidLineHeight: "INVALID_LINE_HEIGHT",
  InvalidAutoRevisionInterval: "INVALID_AUTO_REVISION_INTERVAL",
  InvalidMaxRevisionsPerNote: "INVALID_MAX_REVISIONS_PER_NOTE",
  InvalidImageSize: "INVALID_IMAGE_SIZE",
  InvalidImageQuality: "INVALID_IMAGE_QUALITY",
  InvalidSortOrder: "INVALID_SORT_ORDER",
  InvalidFontSize: "INVALID_FONT_SIZE",
  InvalidTheme: "INVALID_THEME",
  InvalidFontFamily: "INVALID_FONT_FAMILY",
} as const;
export type SettingsErrorCode =
  (typeof SettingsErrorCode)[keyof typeof SettingsErrorCode];
