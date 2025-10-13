import { desc, eq } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import {
  type Revision,
  reconstructRevision,
} from "@/core/domain/revision/entity";
import type { RevisionRepository } from "@/core/domain/revision/ports/revisionRepository";
import type { NoteId, RevisionId } from "@/core/domain/revision/valueObject";
import { RepositoryError } from "@/core/error/adapter";
import type { Executor } from "./client";
import { revisions } from "./schema";

export class DrizzleSqliteRevisionRepository implements RevisionRepository {
  constructor(private readonly executor: Executor) {}

  async create(revision: Revision): Promise<Result<Revision, RepositoryError>> {
    try {
      await this.executor.insert(revisions).values({
        id: revision.id,
        noteId: revision.noteId,
        content: revision.content,
        savedAt: revision.savedAt,
      });

      return ok(revision);
    } catch (error) {
      return err(new RepositoryError("Failed to create revision", error));
    }
  }

  async findByNoteId(
    noteId: NoteId,
  ): Promise<Result<Revision[], RepositoryError>> {
    try {
      const result = await this.executor
        .select()
        .from(revisions)
        .where(eq(revisions.noteId, noteId))
        .orderBy(desc(revisions.savedAt));

      const revisionList = result
        .map((row) =>
          reconstructRevision({
            id: row.id,
            noteId: row.noteId,
            content: row.content,
            savedAt: row.savedAt,
          }).unwrapOr(null),
        )
        .filter((revision): revision is Revision => revision !== null);

      return ok(revisionList);
    } catch (error) {
      return err(
        new RepositoryError("Failed to find revisions by note ID", error),
      );
    }
  }

  async findById(
    id: RevisionId,
  ): Promise<Result<Revision | null, RepositoryError>> {
    try {
      const result = await this.executor
        .select()
        .from(revisions)
        .where(eq(revisions.id, id))
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return reconstructRevision({
        id: result[0].id,
        noteId: result[0].noteId,
        content: result[0].content,
        savedAt: result[0].savedAt,
      }).mapErr((error) => new RepositoryError("Invalid revision data", error));
    } catch (error) {
      return err(new RepositoryError("Failed to find revision", error));
    }
  }

  async deleteByNoteId(noteId: NoteId): Promise<Result<void, RepositoryError>> {
    try {
      await this.executor.delete(revisions).where(eq(revisions.noteId, noteId));
      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete revisions", error));
    }
  }
}
