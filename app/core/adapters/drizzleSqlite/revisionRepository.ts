import type { InferSelectModel } from "drizzle-orm";
import { desc, eq, sql } from "drizzle-orm";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { NoteId } from "@/core/domain/note/valueObject";
import type { Revision } from "@/core/domain/revision/entity";
import type { RevisionRepository } from "@/core/domain/revision/ports/revisionRepository";
import type {
  RevisionContent,
  RevisionId,
  Timestamp,
} from "@/core/domain/revision/valueObject";
import type { Executor } from "./client";
import { revisions } from "./schema";

type RevisionDataModel = InferSelectModel<typeof revisions>;

export class DrizzleSqliteRevisionRepository implements RevisionRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: RevisionDataModel): Revision {
    return {
      id: data.id as RevisionId,
      noteId: data.noteId as NoteId,
      content: data.content as RevisionContent,
      createdAt: data.createdAt as Timestamp,
    };
  }

  async create(revision: Revision): Promise<Revision> {
    try {
      await this.executor.insert(revisions).values({
        id: revision.id,
        noteId: revision.noteId,
        content: revision.content,
        createdAt: new Date(revision.createdAt),
      });

      return revision;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to create revision",
        error,
      );
    }
  }

  async delete(id: RevisionId): Promise<void> {
    try {
      await this.executor.delete(revisions).where(eq(revisions.id, id));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete revision",
        error,
      );
    }
  }

  async findById(id: RevisionId): Promise<Revision | null> {
    try {
      const result = await this.executor
        .select()
        .from(revisions)
        .where(eq(revisions.id, id))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return this.into(result[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find revision by ID",
        error,
      );
    }
  }

  async findByNoteId(noteId: NoteId): Promise<Revision[]> {
    try {
      const result = await this.executor
        .select()
        .from(revisions)
        .where(eq(revisions.noteId, noteId))
        .orderBy(desc(revisions.createdAt));

      return result.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find revisions by note ID",
        error,
      );
    }
  }

  async findByNoteIdWithPagination(
    noteId: NoteId,
    params: {
      offset: number;
      limit: number;
    },
  ): Promise<Revision[]> {
    try {
      const result = await this.executor
        .select()
        .from(revisions)
        .where(eq(revisions.noteId, noteId))
        .orderBy(desc(revisions.createdAt))
        .limit(params.limit)
        .offset(params.offset);

      return result.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find revisions by note ID with pagination",
        error,
      );
    }
  }

  async deleteByNoteId(noteId: NoteId): Promise<void> {
    try {
      await this.executor.delete(revisions).where(eq(revisions.noteId, noteId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete revisions by note ID",
        error,
      );
    }
  }

  async findLatestByNoteId(noteId: NoteId): Promise<Revision | null> {
    try {
      const result = await this.executor
        .select()
        .from(revisions)
        .where(eq(revisions.noteId, noteId))
        .orderBy(desc(revisions.createdAt))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return this.into(result[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find latest revision by note ID",
        error,
      );
    }
  }

  async countByNoteId(noteId: NoteId): Promise<number> {
    try {
      const result = await this.executor
        .select({ count: sql<number>`count(*)` })
        .from(revisions)
        .where(eq(revisions.noteId, noteId));

      return Number(result[0].count);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count revisions by note ID",
        error,
      );
    }
  }

  async deleteOldRevisions(noteId: NoteId, keepCount: number): Promise<void> {
    try {
      // Find revisions to delete (keep only the latest keepCount revisions)
      const revisionsToDelete = await this.executor
        .select({ id: revisions.id })
        .from(revisions)
        .where(eq(revisions.noteId, noteId))
        .orderBy(desc(revisions.createdAt))
        .offset(keepCount);

      if (revisionsToDelete.length === 0) {
        return;
      }

      const idsToDelete = revisionsToDelete.map((r) => r.id);

      await this.executor.delete(revisions).where(
        sql`${revisions.id} IN (${sql.join(
          idsToDelete.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete old revisions",
        error,
      );
    }
  }
}
