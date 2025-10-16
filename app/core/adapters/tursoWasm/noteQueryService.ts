/**
 * Turso WASM Note Query Service Adapter
 *
 * Implements NoteQueryService port using Turso WASM raw SQL API.
 * Handles complex read-only queries on Notes including full-text and tag searches.
 */

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
import type { Database } from "./client";

interface NoteRow {
  id: string;
  content: string;
  created_at: number;
  updated_at: number;
}

interface TagRelationRow {
  tag_id: string;
}

interface NoteIdRow {
  note_id: string;
}

export class TursoWasmNoteQueryService implements NoteQueryService {
  constructor(private readonly db: Database) {}

  /**
   * Convert database row to Note entity
   */
  private async into(row: NoteRow): Promise<Note> {
    // Fetch tag IDs for this note
    const stmt = this.db.prepare(
      "SELECT tag_id FROM note_tag_relations WHERE note_id = ?",
    );
    const tagRelations = (await stmt.all([row.id])) as TagRelationRow[];

    return {
      id: createNoteId(row.id),
      content: row.content as Note["content"],
      tagIds: tagRelations.map((r) => createTagId(r.tag_id)),
      createdAt: new Date(row.created_at * 1000),
      updatedAt: new Date(row.updated_at * 1000),
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
    const orderColumn = orderBy === "created_at" ? "created_at" : "updated_at";
    const orderDirection = order === "asc" ? "ASC" : "DESC";

    try {
      // Step 1: If tags are specified, get filtered note IDs first
      let filteredNoteIds: string[] | null = null;
      if (tagIds.length > 0) {
        const tagPlaceholders = tagIds.map(() => "?").join(",");
        const tagFilterStmt = this.db.prepare(`
          SELECT note_id
          FROM note_tag_relations
          WHERE tag_id IN (${tagPlaceholders})
          GROUP BY note_id
          HAVING COUNT(DISTINCT tag_id) = ?
        `);
        const tagFilterRows = (await tagFilterStmt.all([
          ...tagIds,
          tagIds.length,
        ])) as NoteIdRow[];
        filteredNoteIds = tagFilterRows.map((r) => r.note_id);

        // If no notes match the tag filter, return empty result
        if (filteredNoteIds.length === 0) {
          return {
            items: [],
            count: 0,
          };
        }
      }

      // Step 2: Build WHERE conditions for main query
      const conditions: string[] = [];
      const whereParams: (string | number)[] = [];

      // Full-text search condition
      if (query.length > 0) {
        conditions.push("content LIKE ?");
        whereParams.push(`%${query}%`);
      }

      // Add note ID filter if tags were specified
      if (filteredNoteIds !== null) {
        const idPlaceholders = filteredNoteIds.map(() => "?").join(",");
        conditions.push(`id IN (${idPlaceholders})`);
        whereParams.push(...filteredNoteIds);
      }

      // Combine conditions with AND
      const whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

      // Get items
      const itemsStmt = this.db.prepare(`
        SELECT id, content, created_at, updated_at
        FROM notes
        ${whereClause}
        ORDER BY ${orderColumn} ${orderDirection}
        LIMIT ? OFFSET ?
      `);
      const rows = (await itemsStmt.all([
        ...whereParams,
        limit,
        offset,
      ])) as NoteRow[];

      // Get count
      const countStmt = this.db.prepare(`
        SELECT COUNT(*) as count
        FROM notes
        ${whereClause}
      `);
      const countResult = (await countStmt.get(whereParams)) as {
        count: number;
      };

      const noteEntities = await Promise.all(rows.map((row) => this.into(row)));

      return {
        items: noteEntities,
        count: countResult.count,
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
      const stmt = this.db.prepare(
        "SELECT note_id FROM note_tag_relations WHERE tag_id = ?",
      );
      const rows = (await stmt.all([tagId])) as NoteIdRow[];

      return rows.map((r) => createNoteId(r.note_id));
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
      const placeholders = tagIds.map(() => "?").join(",");
      const stmt = this.db.prepare(`
        SELECT note_id
        FROM note_tag_relations
        WHERE tag_id IN (${placeholders})
        GROUP BY note_id
        HAVING COUNT(DISTINCT tag_id) = ?
      `);
      const rows = (await stmt.all([...tagIds, tagIds.length])) as NoteIdRow[];

      return rows.map((r) => createNoteId(r.note_id));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find note IDs by tag IDs",
        error,
      );
    }
  }
}
