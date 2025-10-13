import { DatabaseErrorCode } from "@/core/domain/database/errorCode";
import { ImageErrorCode } from "@/core/domain/image/errorCode";
import { NoteErrorCode } from "@/core/domain/note/errorCode";
import { RevisionErrorCode } from "@/core/domain/revision/errorCode";
import { SettingsErrorCode } from "@/core/domain/settings/errorCode";
import { TagErrorCode } from "@/core/domain/tag/errorCode";
import { AnyError } from "@/lib/error";

export const BusinessRuleErrorCode = {
  ...NoteErrorCode,
  ...TagErrorCode,
  ...RevisionErrorCode,
  ...SettingsErrorCode,
  ...DatabaseErrorCode,
  ...ImageErrorCode,
} as const;
export type BusinessRuleErrorCode =
  (typeof BusinessRuleErrorCode)[keyof typeof BusinessRuleErrorCode];

/**
 * Business rule error
 */
export class BusinessRuleError extends AnyError {
  override readonly name = "BusinessRuleError";

  constructor(
    public readonly code: BusinessRuleErrorCode,
    message: string,
    cause?: unknown,
  ) {
    super(message, cause);
  }
}
