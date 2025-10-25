/**
 * Drizzle SQLite Note Query Service Adapter
 *
 * Implements NoteQueryService port using Drizzle ORM and SQLite.
 * Handles complex read-only queries on Notes including full-text and tag searches.
 */

import type { InferSelectModel } from "drizzle-orm";
import { and, asc, count, desc, eq, inArray, like, sql } from "drizzle-orm";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Note } from "@/core/domain/note/entity";
import type { NoteQueryService } from "@/core/domain/note/ports/noteQueryService";
import type {
  NoteId,
  OrderBy,
  SortOrder,
} from "@/core/domain/note/valueObject";
import { createNoteId } from "@/core/domain/note/valueObject";
import type { TagId } from "@/core/domain/tag/valueObject";
import { createTagId } from "@/core/domain/tag/valueObject";
import type { Pagination, PaginationResult } from "@/lib/pagination";
import type { Executor } from "./client";
import { notes, noteTagRelations } from "./schema";

type NoteDataModel = InferSelectModel<typeof notes>;

export class DrizzleSqliteNoteQueryService implements NoteQueryService {
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
      content: data.content as Note["content"],
      text: data.text as Note["text"],
      tagIds: tagRelations.map((r) => createTagId(r.tagId)),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async combinedSearch(params: {
    query: string;
    tagIds: TagId[];
    pagination: Pagination;
    order: SortOrder;
    orderBy: OrderBy;
  }): Promise<PaginationResult<Note>> {
    const { query, tagIds, pagination, order, orderBy } = params;
    const limit = pagination.limit;
    const offset = (pagination.page - 1) * pagination.limit;

    // Map orderBy to column
    const orderColumn =
      orderBy === "created_at" ? notes.createdAt : notes.updatedAt;
    const orderFn = order === "asc" ? asc : desc;

    try {
      // Build WHERE conditions
      const conditions = [];

      // Full-text search condition (search on plain text)
      if (query.length > 0) {
        conditions.push(like(notes.text, `%${query}%`));
      }

      // Tag search condition (AND logic - all tags must match)
      if (tagIds.length > 0) {
        const subquery = this.executor
          .select({ noteId: noteTagRelations.noteId })
          .from(noteTagRelations)
          .where(inArray(noteTagRelations.tagId, tagIds))
          .groupBy(noteTagRelations.noteId)
          .having(
            sql`COUNT(DISTINCT ${noteTagRelations.tagId}) = ${tagIds.length}`,
          );

        conditions.push(inArray(notes.id, subquery));
      }

      // Combine conditions with AND
      const whereClause =
        conditions.length > 0 ? and(...conditions) : undefined;

      // Execute queries in parallel
      const [items, countResult] = await Promise.all([
        this.executor
          .select()
          .from(notes)
          .where(whereClause)
          .orderBy(orderFn(orderColumn))
          .limit(limit)
          .offset(offset),
        this.executor.select({ count: count() }).from(notes).where(whereClause),
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
        "Failed to search notes",
        error,
      );
    }
  }

  async findNoteIdsByTagId(tagId: TagId): Promise<NoteId[]> {
    try {
      const result = await this.executor
        .select({ noteId: noteTagRelations.noteId })
        .from(noteTagRelations)
        .where(eq(noteTagRelations.tagId, tagId));

      return result.map((r) => createNoteId(r.noteId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find note IDs by tag ID",
        error,
      );
    }
  }

  async findNoteIdsByTagIds(tagIds: TagId[]): Promise<NoteId[]> {
    if (tagIds.length === 0) {
      return [];
    }

    try {
      // AND search: notes that have ALL specified tags
      const result = await this.executor
        .select({ noteId: noteTagRelations.noteId })
        .from(noteTagRelations)
        .where(inArray(noteTagRelations.tagId, tagIds))
        .groupBy(noteTagRelations.noteId)
        .having(
          sql`COUNT(DISTINCT ${noteTagRelations.tagId}) = ${tagIds.length}`,
        );

      return result.map((r) => createNoteId(r.noteId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find note IDs by tag IDs",
        error,
      );
    }
  }
}
