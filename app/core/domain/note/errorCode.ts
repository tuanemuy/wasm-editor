/**
 * Note Domain - Error Codes
 *
 * Defines error codes for the Note domain.
 */
export const NoteErrorCode = {
  // Content related
  ContentEmpty: "NOTE_CONTENT_EMPTY",
  ContentTooLong: "NOTE_CONTENT_TOO_LONG",

  // Sort related
  InvalidSortOrder: "NOTE_INVALID_SORT_ORDER",
  InvalidOrderBy: "NOTE_INVALID_ORDER_BY",
} as const;

export type NoteErrorCode = (typeof NoteErrorCode)[keyof typeof NoteErrorCode];
