/**
 * Note Domain - Error Codes
 *
 * Defines error codes for the Note domain.
 */
export const NoteErrorCode = {
  // Content related
  NoteContentInvalid: "NOTE_CONTENT_INVALID",

  // Text related
  NoteTextEmpty: "NOTE_TEXT_EMPTY",
  NoteTextTooLong: "NOTE_TEXT_TOO_LONG",

  // Sort related
  NoteInvalidSortOrder: "NOTE_INVALID_SORT_ORDER",
  NoteInvalidOrderBy: "NOTE_INVALID_ORDER_BY",
} as const;

export type NoteErrorCode = (typeof NoteErrorCode)[keyof typeof NoteErrorCode];
