/**
 * Tag Domain - Error Codes
 *
 * Defines error codes for the Tag domain.
 */
export const TagErrorCode = {
  // Tag name related
  NameEmpty: "TAG_NAME_EMPTY",
  NameTooLong: "TAG_NAME_TOO_LONG",
  NameInvalidCharacter: "TAG_NAME_INVALID_CHARACTER",
} as const;

export type TagErrorCode = (typeof TagErrorCode)[keyof typeof TagErrorCode];
