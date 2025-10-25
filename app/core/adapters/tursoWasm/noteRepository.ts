/**
 * Turso WASM Note Repository Adapter
 *
 * Implements NoteRepository port using Turso WASM raw SQL API.
 * Handles Note aggregate persistence including tag relationships.
 */

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
} from "@/core/domain/note/valueObject";
import { createNoteId } from "@/core/domain/note/valueObject";
import { createTagId } from "@/core/domain/tag/valueObject";
import type { Pagination, PaginationResult } from "@/lib/pagination";
import type { Database } from "./client";

interface NoteRow {
  id: string;
  content: string; // JSON string from database
  text: string;
  created_at: number;
  updated_at: number;
}

interface TagRelationRow {
  tag_id: string;
}

export class TursoWasmNoteRepository implements NoteRepository {
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

    // Parse JSON content from database
    const content = JSON.parse(row.content);

    return {
      id: createNoteId(row.id),
      content: content as Note["content"],
      text: row.text as Note["text"],
      tagIds: tagRelations.map((r) => createTagId(r.tag_id)),
      createdAt: new Date(row.created_at * 1000),
      updatedAt: new Date(row.updated_at * 1000),
    };
  }

  async save(note: Note): Promise<void> {
    try {
      const createdAtUnix = Math.floor(note.createdAt.getTime() / 1000);
      const updatedAtUnix = Math.floor(note.updatedAt.getTime() / 1000);

      // Serialize content to JSON string
      const contentJson = JSON.stringify(note.content);

      // Upsert note
      const upsertStmt = this.db.prepare(`
        INSERT INTO notes (id, content, text, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          content = excluded.content,
          text = excluded.text,
          updated_at = excluded.updated_at
      `);
      await upsertStmt.run([
        note.id,
        contentJson,
        note.text,
        createdAtUnix,
        updatedAtUnix,
      ]);

      // Delete existing tag relations
      const deleteStmt = this.db.prepare(
        "DELETE FROM note_tag_relations WHERE note_id = ?",
      );
      await deleteStmt.run([note.id]);

      // Insert new tag relations
      if (note.tagIds.length > 0) {
        const insertStmt = this.db.prepare(`
          INSERT INTO note_tag_relations (note_id, tag_id, created_at)
          VALUES (?, ?, unixepoch())
        `);
        for (const tagId of note.tagIds) {
          await insertStmt.run([note.id, tagId]);
        }
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
      const stmt = this.db.prepare(
        "SELECT id, content, text, created_at, updated_at FROM notes WHERE id = ? LIMIT 1",
      );
      const row = (await stmt.get([id])) as NoteRow | undefined;

      if (!row) {
        throw new NotFoundError(
          NotFoundErrorCode.NoteNotFound,
          `Note not found: ${id}`,
        );
      }

      return await this.into(row);
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
    const orderColumn = orderBy === "created_at" ? "created_at" : "updated_at";
    const orderDirection = order === "asc" ? "ASC" : "DESC";

    try {
      // Get items
      const itemsStmt = this.db.prepare(`
        SELECT id, content, text, created_at, updated_at
        FROM notes
        ORDER BY ${orderColumn} ${orderDirection}
        LIMIT ? OFFSET ?
      `);
      const rows = (await itemsStmt.all([limit, offset])) as NoteRow[];

      // Get count
      const countStmt = this.db.prepare("SELECT COUNT(*) as count FROM notes");
      const countResult = (await countStmt.get([])) as { count: number };

      const noteEntities = await Promise.all(rows.map((row) => this.into(row)));

      return {
        items: noteEntities,
        count: countResult.count,
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
      const stmt = this.db.prepare("DELETE FROM notes WHERE id = ?");
      await stmt.run([id]);
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
      const stmt = this.db.prepare(
        "SELECT COUNT(*) as count FROM notes WHERE id = ?",
      );
      const result = (await stmt.get([id])) as { count: number };

      return result.count > 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to check note existence",
        error,
      );
    }
  }
}
