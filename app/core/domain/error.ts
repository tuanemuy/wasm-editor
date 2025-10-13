import { AnyError } from "@/lib/error";
// import { ${domain}ErrorCode } from "@/core/domain/${domain}/errorCode";

export const BusinessRuleErrorCode = {
  // ...${domain}ErrorCode,
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
