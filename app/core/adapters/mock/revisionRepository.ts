import { err, ok, type Result } from "neverthrow";
import type { Revision } from "@/core/domain/revision/entity";
import type { RevisionRepository } from "@/core/domain/revision/ports/revisionRepository";
import type { NoteId, RevisionId } from "@/core/domain/revision/valueObject";
import { RepositoryError } from "@/core/error/adapter";

/**
 * Mock revision repository for testing
 */
export class MockRevisionRepository implements RevisionRepository {
  private revisions: Map<RevisionId, Revision> = new Map();
  private shouldFailCreate = false;
  private shouldFailFindByNoteId = false;
  private shouldFailFindById = false;
  private shouldFailDeleteByNoteId = false;

  constructor(initialRevisions?: Revision[]) {
    if (initialRevisions) {
      for (const revision of initialRevisions) {
        this.revisions.set(revision.id, revision);
      }
    }
  }

  /**
   * Set whether create should fail
   */
  setShouldFailCreate(shouldFail: boolean): void {
    this.shouldFailCreate = shouldFail;
  }

  /**
   * Set whether findByNoteId should fail
   */
  setShouldFailFindByNoteId(shouldFail: boolean): void {
    this.shouldFailFindByNoteId = shouldFail;
  }

  /**
   * Set whether findById should fail
   */
  setShouldFailFindById(shouldFail: boolean): void {
    this.shouldFailFindById = shouldFail;
  }

  /**
   * Set whether deleteByNoteId should fail
   */
  setShouldFailDeleteByNoteId(shouldFail: boolean): void {
    this.shouldFailDeleteByNoteId = shouldFail;
  }

  /**
   * Create a new revision
   */
  async create(revision: Revision): Promise<Result<Revision, RepositoryError>> {
    if (this.shouldFailCreate) {
      return err(new RepositoryError("Mock repository error"));
    }

    this.revisions.set(revision.id, revision);
    return ok(revision);
  }

  /**
   * Find all revisions for a note (ordered by savedAt desc)
   */
  async findByNoteId(
    noteId: NoteId,
  ): Promise<Result<Revision[], RepositoryError>> {
    if (this.shouldFailFindByNoteId) {
      return err(new RepositoryError("Mock repository error"));
    }

    const revisions = Array.from(this.revisions.values())
      .filter((revision) => revision.noteId === noteId)
      .sort((a, b) => b.savedAt.getTime() - a.savedAt.getTime());

    return ok(revisions);
  }

  /**
   * Find a revision by ID
   */
  async findById(
    id: RevisionId,
  ): Promise<Result<Revision | null, RepositoryError>> {
    if (this.shouldFailFindById) {
      return err(new RepositoryError("Mock repository error"));
    }

    const revision = this.revisions.get(id);
    return ok(revision ?? null);
  }

  /**
   * Delete all revisions for a note
   */
  async deleteByNoteId(noteId: NoteId): Promise<Result<void, RepositoryError>> {
    if (this.shouldFailDeleteByNoteId) {
      return err(new RepositoryError("Mock repository error"));
    }

    for (const [id, revision] of this.revisions.entries()) {
      if (revision.noteId === noteId) {
        this.revisions.delete(id);
      }
    }

    return ok(undefined);
  }

  /**
   * Reset the repository state
   */
  reset(): void {
    this.revisions.clear();
    this.shouldFailCreate = false;
    this.shouldFailFindByNoteId = false;
    this.shouldFailFindById = false;
    this.shouldFailDeleteByNoteId = false;
  }
}
