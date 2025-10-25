/**
 * Note Domain - Error Codes
 *
 * Defines error codes for the Note domain.
 */
export const NoteErrorCode = {
  // Content related
  NoteContentEmpty: "NOTE_CONTENT_EMPTY",
  NoteContentTooLong: "NOTE_CONTENT_TOO_LONG",

  // Sort related
  NoteInvalidSortOrder: "NOTE_INVALID_SORT_ORDER",
  NoteInvalidOrderBy: "NOTE_INVALID_ORDER_BY",
} as const;

export type NoteErrorCode = (typeof NoteErrorCode)[keyof typeof NoteErrorCode];
