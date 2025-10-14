/**
 * Note Domain - Value Objects
 *
 * Defines value objects for the Note domain with business rule validation.
 */
import { v7 as uuidv7 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { NoteErrorCode } from "./errorCode";

const NOTE_CONTENT_MAX_LENGTH = 100000;

// ============================================================================
// NoteId
// ============================================================================

export type NoteId = string & { readonly brand: "NoteId" };

/**
 * Create a NoteId from an existing ID string
 */
export function createNoteId(id: string): NoteId {
  return id as NoteId;
}

/**
 * Generate a new NoteId using UUID v7 (time-ordered)
 */
export function generateNoteId(): NoteId {
  return uuidv7() as NoteId;
}

// ============================================================================
// NoteContent
// ============================================================================

export type NoteContent = string & { readonly brand: "NoteContent" };

/**
 * Create NoteContent with validation
 *
 * Business Rules:
 * - Content can be empty (allows creating new notes without content)
 * - Content must not exceed 100,000 characters
 *
 * @throws {BusinessRuleError} If validation fails
 */
export function createNoteContent(content: string): NoteContent {
  if (content.length > NOTE_CONTENT_MAX_LENGTH) {
    throw new BusinessRuleError(
      NoteErrorCode.ContentTooLong,
      `Note content exceeds maximum length of ${NOTE_CONTENT_MAX_LENGTH} characters`,
    );
  }

  return content as NoteContent;
}

// ============================================================================
// SortOrder
// ============================================================================

export type SortOrder = "asc" | "desc";

/**
 * Create SortOrder with validation
 *
 * @throws {BusinessRuleError} If validation fails
 */
export function createSortOrder(order: string): SortOrder {
  if (order !== "asc" && order !== "desc") {
    throw new BusinessRuleError(
      NoteErrorCode.InvalidSortOrder,
      `Invalid sort order: ${order}. Must be "asc" or "desc"`,
    );
  }
  return order as SortOrder;
}

/**
 * Get default sort order (desc)
 */
export function getDefaultSortOrder(): SortOrder {
  return "desc";
}

// ============================================================================
// OrderBy
// ============================================================================

export type OrderBy = "created_at" | "updated_at";

/**
 * Create OrderBy with validation
 *
 * @throws {BusinessRuleError} If validation fails
 */
export function createOrderBy(field: string): OrderBy {
  if (field !== "created_at" && field !== "updated_at") {
    throw new BusinessRuleError(
      NoteErrorCode.InvalidOrderBy,
      `Invalid order by field: ${field}. Must be "created_at" or "updated_at"`,
    );
  }
  return field as OrderBy;
}

/**
 * Get default order by field (created_at)
 */
export function getDefaultOrderBy(): OrderBy {
  return "created_at";
}
