/**
 * Tag Domain - Error Codes
 *
 * Defines error codes for the Tag domain.
 */
export const TagErrorCode = {
  // Tag name related
  TagNameEmpty: "TAG_NAME_EMPTY",
  TagNameTooLong: "TAG_NAME_TOO_LONG",
  TagNameInvalidCharacter: "TAG_NAME_INVALID_CHARACTER",
} as const;

export type TagErrorCode = (typeof TagErrorCode)[keyof typeof TagErrorCode];
