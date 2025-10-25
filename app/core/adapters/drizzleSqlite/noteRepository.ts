/**
 * Drizzle SQLite Note Repository Adapter
 *
 * Implements NoteRepository port using Drizzle ORM and SQLite.
 * Handles Note aggregate persistence including tag relationships.
 */

import type { InferSelectModel } from "drizzle-orm";
import { asc, count, desc, eq } from "drizzle-orm";
import {
  NotFoundError,
  NotFoundErrorCode,
  SystemError,
  SystemErrorCode,
} from "@/core/application/error";
import type { Note } from "@/core/domain/note/entity";
import type { NoteRepository } from "@/core/domain/note/ports/noteRepository";
import type {
  NoteId,
  OrderBy,
  SortOrder,
  StructuredContent,
} from "@/core/domain/note/valueObject";
import {
  createNoteContent,
  createNoteId,
  createText,
} from "@/core/domain/note/valueObject";
import { createTagId } from "@/core/domain/tag/valueObject";
import type { Pagination, PaginationResult } from "@/lib/pagination";
import type { Executor } from "./client";
import { notes, noteTagRelations } from "./schema";

type NoteDataModel = InferSelectModel<typeof notes>;

export class DrizzleSqliteNoteRepository implements NoteRepository {
  constructor(private readonly executor: Executor) {}

  /**
   * Convert database row to Note entity
   */
  private async into(data: NoteDataModel): Promise<Note> {
    // Fetch tag IDs for this note
    const tagRelations = await this.executor
      .select({ tagId: noteTagRelations.tagId })
      .from(noteTagRelations)
      .where(eq(noteTagRelations.noteId, data.id));

    return {
      id: createNoteId(data.id),
      content: createNoteContent(data.content as StructuredContent),
      text: createText(data.text as string),
      tagIds: tagRelations.map((r) => createTagId(r.tagId)),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async save(note: Note): Promise<void> {
    try {
      // Upsert note
      await this.executor
        .insert(notes)
        .values({
          id: note.id,
          content: note.content,
          text: note.text,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        })
        .onConflictDoUpdate({
          target: notes.id,
          set: {
            content: note.content,
            text: note.text,
            updatedAt: note.updatedAt,
          },
        });

      // Delete existing tag relations
      await this.executor
        .delete(noteTagRelations)
        .where(eq(noteTagRelations.noteId, note.id));

      // Insert new tag relations
      if (note.tagIds.length > 0) {
        await this.executor.insert(noteTagRelations).values(
          note.tagIds.map((tagId) => ({
            noteId: note.id,
            tagId: tagId,
            createdAt: new Date(),
          })),
        );
      }
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save note",
        error,
      );
    }
  }

  async findById(id: NoteId): Promise<Note> {
    try {
      const result = await this.executor
        .select()
        .from(notes)
        .where(eq(notes.id, id))
        .limit(1);

      if (result.length === 0) {
        throw new NotFoundError(
          NotFoundErrorCode.NoteNotFound,
          `Note not found: ${id}`,
        );
      }

      return await this.into(result[0]);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find note",
        error,
      );
    }
  }

  async findAll(params: {
    pagination: Pagination;
    order: SortOrder;
    orderBy: OrderBy;
  }): Promise<PaginationResult<Note>> {
    const { pagination, order, orderBy } = params;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    // Map orderBy to column
    const orderColumn =
      orderBy === "created_at" ? notes.createdAt : notes.updatedAt;
    const orderFn = order === "asc" ? asc : desc;

    try {
      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(notes)
          .orderBy(orderFn(orderColumn))
          .limit(limit)
          .offset(offset),
        this.executor.select({ count: count() }).from(notes),
      ]);

      const noteEntities = await Promise.all(
        items.map((item) => this.into(item)),
      );

      return {
        items: noteEntities,
        count: countResult[0].count,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find notes",
        error,
      );
    }
  }

  async delete(id: NoteId): Promise<void> {
    try {
      // Check if note exists
      const exists = await this.exists(id);
      if (!exists) {
        throw new NotFoundError(
          NotFoundErrorCode.NoteNotFound,
          `Note not found: ${id}`,
        );
      }

      // Delete note (tag relations will be cascade deleted)
      await this.executor.delete(notes).where(eq(notes.id, id));
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete note",
        error,
      );
    }
  }

  async exists(id: NoteId): Promise<boolean> {
    try {
      const result = await this.executor
        .select({ count: count() })
        .from(notes)
        .where(eq(notes.id, id));

      return result[0].count > 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to check note existence",
        error,
      );
    }
  }
}
