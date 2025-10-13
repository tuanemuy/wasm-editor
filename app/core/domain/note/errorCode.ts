export const NoteErrorCode = {
  NoteBodyInvalid: "NOTE_BODY_INVALID",
  SearchQueryTooLong: "SEARCH_QUERY_TOO_LONG",
  InvalidPaginationParams: "INVALID_PAGINATION_PARAMS",
} as const;
export type NoteErrorCode = (typeof NoteErrorCode)[keyof typeof NoteErrorCode];
