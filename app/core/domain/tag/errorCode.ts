export const TagErrorCode = {
  TagNameEmpty: "TAG_NAME_EMPTY",
  TagNameTooLong: "TAG_NAME_TOO_LONG",
  TagNameInvalid: "TAG_NAME_INVALID",
  UsageCountNegative: "USAGE_COUNT_NEGATIVE",
} as const;
export type TagErrorCode = (typeof TagErrorCode)[keyof typeof TagErrorCode];
