/**
 * Turso WASM Tag Repository Adapter
 *
 * Implements TagRepository port using Turso WASM raw SQL API.
 * Handles Tag aggregate persistence.
 */

import {
  NotFoundError,
  NotFoundErrorCode,
  SystemError,
  SystemErrorCode,
} from "@/core/application/error";
import type { Tag } from "@/core/domain/tag/entity";
import type { TagRepository } from "@/core/domain/tag/ports/tagRepository";
import type { TagId, TagName } from "@/core/domain/tag/valueObject";
import { createTagId } from "@/core/domain/tag/valueObject";
import type { Database } from "./client";

interface TagRow {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

export class TursoWasmTagRepository implements TagRepository {
  constructor(private readonly db: Database) {}

  /**
   * Convert database row to Tag entity
   */
  private into(row: TagRow): Tag {
    return {
      id: createTagId(row.id),
      name: row.name as Tag["name"],
      createdAt: new Date(row.created_at * 1000),
      updatedAt: new Date(row.updated_at * 1000),
    };
  }

  async save(tag: Tag): Promise<void> {
    try {
      const createdAtUnix = Math.floor(tag.createdAt.getTime() / 1000);
      const updatedAtUnix = Math.floor(tag.updatedAt.getTime() / 1000);

      const stmt = this.db.prepare(`
        INSERT INTO tags (id, name, created_at, updated_at)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name = excluded.name,
          updated_at = excluded.updated_at
      `);
      await stmt.run([tag.id, tag.name, createdAtUnix, updatedAtUnix]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to save tag",
        error,
      );
    }
  }

  async findByName(name: TagName): Promise<Tag | null> {
    try {
      const stmt = this.db.prepare(
        "SELECT id, name, created_at, updated_at FROM tags WHERE name = ? LIMIT 1",
      );
      const row = (await stmt.get([name])) as TagRow | undefined;

      if (!row) {
        return null;
      }

      return this.into(row);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find tag by name",
        error,
      );
    }
  }

  async findById(id: TagId): Promise<Tag> {
    try {
      const stmt = this.db.prepare(
        "SELECT id, name, created_at, updated_at FROM tags WHERE id = ? LIMIT 1",
      );
      const row = (await stmt.get([id])) as TagRow | undefined;

      if (!row) {
        throw new NotFoundError(
          NotFoundErrorCode.TagNotFound,
          `Tag not found: ${id}`,
        );
      }

      return this.into(row);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find tag",
        error,
      );
    }
  }

  async findByIds(ids: TagId[]): Promise<Tag[]> {
    if (ids.length === 0) {
      return [];
    }

    try {
      // Build placeholders for IN clause
      const placeholders = ids.map(() => "?").join(",");
      const stmt = this.db.prepare(`
        SELECT id, name, created_at, updated_at
        FROM tags
        WHERE id IN (${placeholders})
      `);
      const rows = (await stmt.all(ids)) as TagRow[];

      return rows.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find tags by IDs",
        error,
      );
    }
  }

  async findAll(): Promise<Tag[]> {
    try {
      const stmt = this.db.prepare(
        "SELECT id, name, created_at, updated_at FROM tags",
      );
      const rows = (await stmt.all([])) as TagRow[];

      return rows.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find all tags",
        error,
      );
    }
  }

  async delete(id: TagId): Promise<void> {
    try {
      const stmt = this.db.prepare("DELETE FROM tags WHERE id = ?");
      await stmt.run([id]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete tag",
        error,
      );
    }
  }

  async deleteMany(ids: TagId[]): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    try {
      // Build placeholders for IN clause
      const placeholders = ids.map(() => "?").join(",");
      const stmt = this.db.prepare(`
        DELETE FROM tags WHERE id IN (${placeholders})
      `);
      await stmt.run(ids);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete tags",
        error,
      );
    }
  }

  async exists(id: TagId): Promise<boolean> {
    try {
      const stmt = this.db.prepare(
        "SELECT COUNT(*) as count FROM tags WHERE id = ?",
      );
      const result = (await stmt.get([id])) as { count: number };

      return result.count > 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to check tag existence",
        error,
      );
    }
  }
}
