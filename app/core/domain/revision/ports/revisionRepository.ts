import type { Result } from "neverthrow";
import type { RepositoryError } from "@/core/error/adapter";
import type { Revision } from "../entity";
import type { NoteId, RevisionId } from "../valueObject";

/**
 * Revision repository interface
 */
export interface RevisionRepository {
  /**
   * Create a new revision
   */
  create(revision: Revision): Promise<Result<Revision, RepositoryError>>;

  /**
   * Find all revisions for a note (ordered by savedAt desc)
   */
  findByNoteId(noteId: NoteId): Promise<Result<Revision[], RepositoryError>>;

  /**
   * Find a revision by ID
   */
  findById(id: RevisionId): Promise<Result<Revision | null, RepositoryError>>;

  /**
   * Delete all revisions for a note
   */
  deleteByNoteId(noteId: NoteId): Promise<Result<void, RepositoryError>>;
}
