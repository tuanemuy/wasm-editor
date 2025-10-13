import type { NoteId } from "@/core/domain/note/valueObject";
import type { Tag } from "../entity";
import type { TagId } from "../valueObject";

export interface NoteTagRelationRepository {
  /**
   * Add a relation between note and tag
   * @throws {SystemError} DB save error
   */
  addRelation(noteId: NoteId, tagId: TagId): Promise<void>;

  /**
   * Remove a relation between note and tag
   * @throws {SystemError} DB delete error
   */
  removeRelation(noteId: NoteId, tagId: TagId): Promise<void>;

  /**
   * Remove all relations for a note
   * @throws {SystemError} DB delete error
   */
  removeAllRelationsByNote(noteId: NoteId): Promise<void>;

  /**
   * Find tags by note ID
   * @throws {SystemError} DB fetch error
   */
  findTagsByNote(noteId: NoteId): Promise<Tag[]>;

  /**
   * Find note IDs by tag ID
   * @throws {SystemError} DB fetch error
   */
  findNotesByTag(tagId: TagId): Promise<NoteId[]>;

  /**
   * Find note IDs by multiple tag IDs (AND search)
   * @throws {SystemError} DB fetch error
   */
  findNotesByTags(tagIds: TagId[]): Promise<NoteId[]>;
}
