/**
 * Tag Domain - Value Objects
 *
 * Defines value objects for the Tag domain with business rule validation.
 */
import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { TagErrorCode } from "./errorCode";

const TAG_NAME_MAX_LENGTH = 50;
const TAG_NAME_PATTERN = /^[a-zA-Z0-9ぁ-んァ-ヶー一-龯\-_]+$/;

// ============================================================================
// TagId
// ============================================================================

export type TagId = string & { readonly brand: "TagId" };

/**
 * Create a TagId from an existing ID string
 */
export function createTagId(id: string): TagId {
  return id as TagId;
}

/**
 * Generate a new TagId using UUID v7 (time-ordered)
 */
export function generateTagId(): TagId {
  return uuidv7() as TagId;
}

// ============================================================================
// TagName
// ============================================================================

export type TagName = string & { readonly brand: "TagName" };

/**
 * Create TagName with validation
 *
 * Business Rules:
 * - Tag name must not be empty
 * - Tag name must not exceed 50 characters
 * - Tag name must only contain: alphanumeric, hiragana, katakana, kanji, hyphen, underscore
 * - Tag name must not contain spaces
 * - Leading/trailing whitespace is trimmed
 * - Case-sensitive
 *
 * Pattern: ^[a-zA-Z0-9ぁ-んァ-ヶー一-龯\-_]+$
 *
 * @throws {BusinessRuleError} If validation fails
 */
export function createTagName(name: string): TagName {
  // Trim leading/trailing whitespace
  const trimmed = name.trim();

  if (trimmed.length === 0) {
    throw new BusinessRuleError(
      TagErrorCode.TagNameEmpty,
      "Tag name cannot be empty",
    );
  }

  if (trimmed.length > TAG_NAME_MAX_LENGTH) {
    throw new BusinessRuleError(
      TagErrorCode.TagNameTooLong,
      `Tag name exceeds maximum length of ${TAG_NAME_MAX_LENGTH} characters`,
    );
  }

  if (!TAG_NAME_PATTERN.test(trimmed)) {
    throw new BusinessRuleError(
      TagErrorCode.TagNameInvalidCharacter,
      "Tag name contains invalid characters. Only alphanumeric, hiragana, katakana, kanji, hyphen, and underscore are allowed",
    );
  }

  return trimmed as TagName;
}
