/**
 * Tag Domain - Entity
 *
 * Tag is the aggregate root that represents a tag.
 * Tags are used to categorize and organize notes.
 */
import {
  createTagName,
  generateTagId,
  type TagId,
  type TagName,
} from "./valueObject";

// ============================================================================
// Tag Entity
// ============================================================================

export type Tag = Readonly<{
  id: TagId;
  name: TagName;
  createdAt: Date;
  updatedAt: Date;
}>;

// ============================================================================
// TagWithUsage (DTO)
// ============================================================================

/**
 * Tag with usage count
 *
 * This is a Data Transfer Object (DTO) used for displaying tags with their usage count.
 * The usage count represents the number of notes that have this tag.
 * This count is calculated by joining with the noteTagRelations table in the QueryService.
 */
export type TagWithUsage = Tag & {
  usageCount: number;
};

// ============================================================================
// Entity Operations
// ============================================================================

export type CreateTagParams = {
  name: string;
};

/**
 * Create a new tag
 *
 * Business Rules:
 * - Tag name must not be empty (validated by createTagName)
 * - Tag name must not exceed 50 characters (validated by createTagName)
 * - Tag name must only contain valid characters (validated by createTagName)
 * - createdAt and updatedAt are set to current time
 *
 * @throws {BusinessRuleError} If name validation fails
 */
export function createTag(params: CreateTagParams): Tag {
  const now = new Date();

  return {
    id: generateTagId(),
    name: createTagName(params.name),
    createdAt: now,
    updatedAt: now,
  };
}
