/**
 * Note Domain - Entity
 *
 * Note is the aggregate root that represents a user's note.
 * It manages the note content and associated tags.
 */
import type { TagId } from "@/core/domain/tag/valueObject";
import {
  createNoteContent,
  generateNoteId,
  type NoteContent,
  type NoteId,
} from "./valueObject";

// ============================================================================
// Note Entity
// ============================================================================

export type Note = Readonly<{
  id: NoteId;
  content: NoteContent;
  tagIds: TagId[];
  createdAt: Date;
  updatedAt: Date;
}>;

// ============================================================================
// Entity Operations
// ============================================================================

export type CreateNoteParams = {
  content: string;
  tagIds?: TagId[];
};

/**
 * Create a new note
 *
 * Business Rules:
 * - Content must not be empty (validated by createNoteContent)
 * - Content must not exceed 100,000 characters (validated by createNoteContent)
 * - tagIds defaults to empty array if not provided
 * - tagIds are deduplicated (Set behavior)
 * - createdAt and updatedAt are set to current time
 *
 * @throws {BusinessRuleError} If content validation fails
 */
export function createNote(params: CreateNoteParams): Note {
  const now = new Date();
  const uniqueTagIds = params.tagIds ? Array.from(new Set(params.tagIds)) : [];

  return {
    id: generateNoteId(),
    content: createNoteContent(params.content),
    tagIds: uniqueTagIds,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Update note content
 *
 * Business Rules:
 * - Content must not be empty (validated by createNoteContent)
 * - Content must not exceed 100,000 characters (validated by createNoteContent)
 * - updatedAt is automatically updated to current time
 * - createdAt remains unchanged
 *
 * @throws {BusinessRuleError} If content validation fails
 */
export function updateContent(note: Note, newContent: string): Note {
  return {
    ...note,
    content: createNoteContent(newContent),
    updatedAt: new Date(),
  };
}

/**
 * Update tag IDs associated with the note
 *
 * Business Rules:
 * - tagIds are deduplicated (Set behavior)
 * - updatedAt is automatically updated to current time
 */
export function updateTagIds(note: Note, tagIds: TagId[]): Note {
  const uniqueTagIds = Array.from(new Set(tagIds));

  return {
    ...note,
    tagIds: uniqueTagIds,
    updatedAt: new Date(),
  };
}
