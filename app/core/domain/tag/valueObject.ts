import { v4 as uuidv4 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { TagErrorCode } from "./errorCode";

// TagId
export type TagId = string & { readonly brand: "TagId" };

export function createTagId(id: string): TagId {
  return id as TagId;
}

export function generateTagId(): TagId {
  return uuidv4() as TagId;
}

// TagName
const TAG_NAME_MIN_LENGTH = 1;
const TAG_NAME_MAX_LENGTH = 50;
const TAG_NAME_PATTERN = /^[a-zA-Z0-9ぁ-んァ-ヶ一-龠々ー\-_]+$/;

export type TagName = string & { readonly brand: "TagName" };

export function createTagName(name: string): TagName {
  if (name.length < TAG_NAME_MIN_LENGTH) {
    throw new BusinessRuleError(TagErrorCode.TagNameEmpty, "Tag name is empty");
  }
  if (name.length > TAG_NAME_MAX_LENGTH) {
    throw new BusinessRuleError(
      TagErrorCode.TagNameTooLong,
      `Tag name exceeds maximum length of ${TAG_NAME_MAX_LENGTH}`,
    );
  }
  if (!TAG_NAME_PATTERN.test(name)) {
    throw new BusinessRuleError(
      TagErrorCode.TagNameInvalid,
      "Tag name contains invalid characters",
    );
  }
  return name as TagName;
}

// UsageCount
export type UsageCount = number & { readonly brand: "UsageCount" };

export function createUsageCount(count: number): UsageCount {
  if (count < 0) {
    throw new BusinessRuleError(
      TagErrorCode.UsageCountNegative,
      "Usage count cannot be negative",
    );
  }
  return count as UsageCount;
}

// Tag extraction pattern
const TAG_EXTRACTION_PATTERN = /#([a-zA-Z0-9ぁ-んァ-ヶ一-龠々ー\-_]+)/g;

/**
 * Extract tag names from content
 */
export function extractTagNamesFromContent(content: string): TagName[] {
  const matches = content.matchAll(TAG_EXTRACTION_PATTERN);
  const tagNames = new Set<string>();

  for (const match of matches) {
    try {
      const tagName = createTagName(match[1]);
      tagNames.add(tagName);
    } catch {
      // Invalid tag names are silently ignored
    }
  }

  return Array.from(tagNames) as TagName[];
}
