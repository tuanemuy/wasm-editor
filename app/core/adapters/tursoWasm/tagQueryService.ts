/**
 * Turso WASM Tag Query Service Adapter
 *
 * Implements TagQueryService port using Turso WASM raw SQL API.
 * Handles complex read-only queries on Tags including usage count aggregation.
 */

import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Tag, TagWithUsage } from "@/core/domain/tag/entity";
import type { TagQueryService } from "@/core/domain/tag/ports/tagQueryService";
import { createTagId } from "@/core/domain/tag/valueObject";
import type { Database } from "./client";

interface TagRow {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
}

interface TagWithUsageRow {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
  usage_count: number;
}

export class TursoWasmTagQueryService implements TagQueryService {
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

  async findAllWithUsage(): Promise<TagWithUsage[]> {
    try {
      // LEFT JOIN with noteTagRelations to calculate usage count
      const stmt = this.db.prepare(`
        SELECT
          tags.id,
          tags.name,
          tags.created_at,
          tags.updated_at,
          COUNT(note_tag_relations.note_id) as usage_count
        FROM tags
        LEFT JOIN note_tag_relations ON tags.id = note_tag_relations.tag_id
        GROUP BY tags.id
        ORDER BY usage_count DESC
      `);
      const rows = (await stmt.all([])) as TagWithUsageRow[];

      return rows.map((r) => ({
        id: createTagId(r.id),
        name: r.name as Tag["name"],
        createdAt: new Date(r.created_at * 1000),
        updatedAt: new Date(r.updated_at * 1000),
        usageCount: r.usage_count,
      }));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find tags with usage",
        error,
      );
    }
  }

  async findUnused(): Promise<Tag[]> {
    try {
      // LEFT JOIN with noteTagRelations to find tags with no relations
      const stmt = this.db.prepare(`
        SELECT
          tags.id,
          tags.name,
          tags.created_at,
          tags.updated_at
        FROM tags
        LEFT JOIN note_tag_relations ON tags.id = note_tag_relations.tag_id
        WHERE note_tag_relations.note_id IS NULL
        GROUP BY tags.id
      `);
      const rows = (await stmt.all([])) as TagRow[];

      return rows.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find unused tags",
        error,
      );
    }
  }
}
