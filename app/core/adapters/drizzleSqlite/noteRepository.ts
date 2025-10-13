import type { InferSelectModel } from "drizzle-orm";
import { asc, desc, eq, like, sql } from "drizzle-orm";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Note } from "@/core/domain/note/entity";
import type { NoteRepository } from "@/core/domain/note/ports/noteRepository";
import type {
  NoteBody,
  NoteId,
  PaginationParams,
  SearchQuery,
  SortOrder,
  Timestamp,
} from "@/core/domain/note/valueObject";
import type { Executor } from "./client";
import { notes, noteTags, tags } from "./schema";

type NoteDataModel = InferSelectModel<typeof notes>;

export class DrizzleSqliteNoteRepository implements NoteRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: NoteDataModel): Note {
    return {
      id: data.id as NoteId,
      body: data.body as NoteBody,
      createdAt: data.createdAt as Timestamp,
      updatedAt: data.updatedAt as Timestamp,
      tags: [], // Tags will be loaded separately via NoteTagRelationRepository
    };
  }

  async create(note: Note): Promise<Note> {
    try {
      await this.executor.insert(notes).values({
        id: note.id,
        body: note.body,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      });

      return note;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to create note",
        error,
      );
    }
  }

  async update(note: Note): Promise<Note> {
    try {
      await this.executor
        .update(notes)
        .set({
          body: note.body,
          updatedAt: new Date(note.updatedAt),
        })
        .where(eq(notes.id, note.id));

      return note;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to update note",
        error,
      );
    }
  }

  async delete(id: NoteId): Promise<void> {
    try {
      await this.executor.delete(notes).where(eq(notes.id, id));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete note",
        error,
      );
    }
  }

  async findById(id: NoteId): Promise<Note | null> {
    try {
      const result = await this.executor
        .select()
        .from(notes)
        .where(eq(notes.id, id))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return this.into(result[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find note by ID",
        error,
      );
    }
  }

  async findAll(params: {
    sortOrder: SortOrder;
    pagination: PaginationParams;
  }): Promise<Note[]> {
    try {
      const orderColumn = params.sortOrder.startsWith("CREATED")
        ? notes.createdAt
        : notes.updatedAt;
      const orderDirection = params.sortOrder.endsWith("ASC") ? asc : desc;

      const result = await this.executor
        .select()
        .from(notes)
        .orderBy(orderDirection(orderColumn))
        .limit(params.pagination.limit)
        .offset(params.pagination.offset);

      return result.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find all notes",
        error,
      );
    }
  }

  async count(): Promise<number> {
    try {
      const result = await this.executor
        .select({ count: sql<number>`count(*)` })
        .from(notes);

      return Number(result[0].count);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to count notes",
        error,
      );
    }
  }

  async search(
    query: SearchQuery,
    params: {
      sortOrder: SortOrder;
      pagination: PaginationParams;
    },
  ): Promise<Note[]> {
    try {
      const orderColumn = params.sortOrder.startsWith("CREATED")
        ? notes.createdAt
        : notes.updatedAt;
      const orderDirection = params.sortOrder.endsWith("ASC") ? asc : desc;

      const result = await this.executor
        .select()
        .from(notes)
        .where(like(notes.body, `%${query}%`))
        .orderBy(orderDirection(orderColumn))
        .limit(params.pagination.limit)
        .offset(params.pagination.offset);

      return result.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to search notes",
        error,
      );
    }
  }

  async findByTags(
    tagNames: string[],
    params: {
      sortOrder: SortOrder;
      pagination: PaginationParams;
    },
  ): Promise<Note[]> {
    try {
      if (tagNames.length === 0) {
        return [];
      }

      const orderColumn = params.sortOrder.startsWith("CREATED")
        ? notes.createdAt
        : notes.updatedAt;
      const orderDirection = params.sortOrder.endsWith("ASC") ? asc : desc;

      // Get note IDs that have all the specified tags (AND search)
      const noteIdsSubquery = this.executor
        .select({ noteId: noteTags.noteId })
        .from(noteTags)
        .innerJoin(tags, eq(noteTags.tagId, tags.id))
        .where(
          sql`${tags.name} IN (${sql.join(
            tagNames.map((name) => sql`${name}`),
            sql`, `,
          )})`,
        )
        .groupBy(noteTags.noteId)
        .having(sql`count(DISTINCT ${tags.id}) = ${tagNames.length}`)
        .as("filtered_notes");

      const result = await this.executor
        .select()
        .from(notes)
        .innerJoin(noteIdsSubquery, eq(notes.id, noteIdsSubquery.noteId))
        .orderBy(orderDirection(orderColumn))
        .limit(params.pagination.limit)
        .offset(params.pagination.offset);

      return result.map((row) => this.into(row.notes));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find notes by tags",
        error,
      );
    }
  }

  async searchWithTags(
    query: SearchQuery,
    tagNames: string[],
    params: {
      sortOrder: SortOrder;
      pagination: PaginationParams;
    },
  ): Promise<Note[]> {
    try {
      if (tagNames.length === 0) {
        return this.search(query, params);
      }

      const orderColumn = params.sortOrder.startsWith("CREATED")
        ? notes.createdAt
        : notes.updatedAt;
      const orderDirection = params.sortOrder.endsWith("ASC") ? asc : desc;

      // Get note IDs that have all the specified tags (AND search)
      const noteIdsSubquery = this.executor
        .select({ noteId: noteTags.noteId })
        .from(noteTags)
        .innerJoin(tags, eq(noteTags.tagId, tags.id))
        .where(
          sql`${tags.name} IN (${sql.join(
            tagNames.map((name) => sql`${name}`),
            sql`, `,
          )})`,
        )
        .groupBy(noteTags.noteId)
        .having(sql`count(DISTINCT ${tags.id}) = ${tagNames.length}`)
        .as("filtered_notes");

      const result = await this.executor
        .select()
        .from(notes)
        .innerJoin(noteIdsSubquery, eq(notes.id, noteIdsSubquery.noteId))
        .where(like(notes.body, `%${query}%`))
        .orderBy(orderDirection(orderColumn))
        .limit(params.pagination.limit)
        .offset(params.pagination.offset);

      return result.map((row) => this.into(row.notes));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to search notes with tags",
        error,
      );
    }
  }
}
