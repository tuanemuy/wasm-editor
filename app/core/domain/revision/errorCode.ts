export const RevisionErrorCode = {
  RevisionContentInvalid: "REVISION_CONTENT_INVALID",
  InvalidRevisionTrigger: "INVALID_REVISION_TRIGGER",
} as const;
export type RevisionErrorCode =
  (typeof RevisionErrorCode)[keyof typeof RevisionErrorCode];
