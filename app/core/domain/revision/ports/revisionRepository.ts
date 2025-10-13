import type { NoteId } from "@/core/domain/note/valueObject";
import type { Revision } from "../entity";
import type { RevisionId } from "../valueObject";

export interface RevisionRepository {
  /**
   * Create a revision
   * @throws {SystemError} DB save error
   */
  create(revision: Revision): Promise<Revision>;

  /**
   * Delete a revision
   * @throws {SystemError} DB delete error
   */
  delete(id: RevisionId): Promise<void>;

  /**
   * Find a revision by ID
   * @throws {SystemError} DB fetch error
   */
  findById(id: RevisionId): Promise<Revision | null>;

  /**
   * Find revisions by note ID (sorted by createdAt desc)
   * @throws {SystemError} DB fetch error
   */
  findByNoteId(noteId: NoteId): Promise<Revision[]>;

  /**
   * Find revisions by note ID with pagination
   * @throws {SystemError} DB fetch error
   */
  findByNoteIdWithPagination(
    noteId: NoteId,
    params: {
      offset: number;
      limit: number;
    },
  ): Promise<Revision[]>;

  /**
   * Delete all revisions for a note
   * @throws {SystemError} DB delete error
   */
  deleteByNoteId(noteId: NoteId): Promise<void>;

  /**
   * Find the latest revision for a note
   * @throws {SystemError} DB fetch error
   */
  findLatestByNoteId(noteId: NoteId): Promise<Revision | null>;

  /**
   * Count revisions for a note
   * @throws {SystemError} DB fetch error
   */
  countByNoteId(noteId: NoteId): Promise<number>;

  /**
   * Delete old revisions for a note, keeping only the specified count
   * @throws {SystemError} DB delete error
   */
  deleteOldRevisions(noteId: NoteId, keepCount: number): Promise<void>;
}
