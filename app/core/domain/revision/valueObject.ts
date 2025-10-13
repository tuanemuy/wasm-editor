import { v4 as uuidv4 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { RevisionErrorCode } from "./errorCode";

// RevisionId
export type RevisionId = string & { readonly brand: "RevisionId" };

export function createRevisionId(id: string): RevisionId {
  return id as RevisionId;
}

export function generateRevisionId(): RevisionId {
  return uuidv4() as RevisionId;
}

// RevisionContent
export type RevisionContent = string & { readonly brand: "RevisionContent" };

export function createRevisionContent(content: string): RevisionContent {
  // Empty string is allowed
  return content as RevisionContent;
}

// Timestamp
export type Timestamp = Date & { readonly brand: "Timestamp" };

export function createTimestamp(date: Date): Timestamp {
  return date as Timestamp;
}

export function nowTimestamp(): Timestamp {
  return new Date() as Timestamp;
}

// RevisionTrigger
export const RevisionTrigger = {
  MANUAL: "MANUAL",
  AUTO: "AUTO",
  CLOSE: "CLOSE",
} as const;
export type RevisionTrigger =
  (typeof RevisionTrigger)[keyof typeof RevisionTrigger];

export function createRevisionTrigger(trigger: string): RevisionTrigger {
  if (!Object.values(RevisionTrigger).includes(trigger as RevisionTrigger)) {
    throw new BusinessRuleError(
      RevisionErrorCode.InvalidRevisionTrigger,
      "Invalid revision trigger",
    );
  }
  return trigger as RevisionTrigger;
}
