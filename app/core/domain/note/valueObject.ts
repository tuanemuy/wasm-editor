/**
 * Note Domain - Value Objects
 *
 * Defines value objects for the Note domain with business rule validation.
 */
import { v7 as uuidv7 } from "uuid";
import type { JsonValue } from "@/lib/json";
import { BusinessRuleError } from "@/core/domain/error";
import { NoteErrorCode } from "./errorCode";

const NOTE_TEXT_MAX_LENGTH = 100000;

// ============================================================================
// Structured Content (Note-specific)
// ============================================================================

/**
 * Structured content for rich text editors
 * Generic structure that doesn't depend on specific editor implementations (e.g., Tiptap)
 *
 * Required field:
 * - type: Document type (e.g., "doc", "paragraph")
 *
 * Optional fields:
 * - content: Child elements or content
 * - [other properties]: Additional attributes (attrs, marks, etc.)
 */
export type StructuredContent = {
  type: string;
  content?: JsonValue;
  [key: string]: JsonValue | undefined;
};

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

export type NoteContent = StructuredContent & { readonly brand: "NoteContent" };

/**
 * Create NoteContent with validation
 *
 * Business Rules:
 * - Must be an object type
 * - Must have required field 'type' (string)
 * - Must be JSON serializable
 * - All properties must be JSON-compatible values
 *
 * @throws {BusinessRuleError} If validation fails
 */
export function createNoteContent(content: StructuredContent): NoteContent {
  // Validate that content is an object
  if (typeof content !== "object" || content === null) {
    throw new BusinessRuleError(
      NoteErrorCode.NoteContentInvalid,
      "Note content must be a valid JSON object",
    );
  }

  // Validate that content has required field 'type'
  if (!("type" in content) || typeof content.type !== "string") {
    throw new BusinessRuleError(
      NoteErrorCode.NoteContentInvalid,
      "Note content must have required field 'type' (string)",
    );
  }

  // Validate that content is JSON serializable
  try {
    JSON.stringify(content);
  } catch {
    throw new BusinessRuleError(
      NoteErrorCode.NoteContentInvalid,
      "Note content must be JSON serializable",
    );
  }

  return content as NoteContent;
}

// ============================================================================
// Text
// ============================================================================

export type Text = string & { readonly brand: "Text" };

/**
 * Create Text with validation
 *
 * Business Rules:
 * - Can be empty (allows new notes to start empty for better UX)
 * - Must not exceed 100,000 characters
 * - Must be a string type
 *
 * @throws {BusinessRuleError} If validation fails
 */
export function createText(text: string): Text {
  if (text.length > NOTE_TEXT_MAX_LENGTH) {
    throw new BusinessRuleError(
      NoteErrorCode.NoteTextTooLong,
      `Note text exceeds maximum length of ${NOTE_TEXT_MAX_LENGTH} characters`,
    );
  }

  return text as Text;
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
      NoteErrorCode.NoteInvalidSortOrder,
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
      NoteErrorCode.NoteInvalidOrderBy,
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
