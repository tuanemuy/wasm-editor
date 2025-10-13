/**
 * Drizzle SQLite Tag Query Service Adapter
 *
 * Implements TagQueryService port using Drizzle ORM and SQLite.
 * Handles complex read-only queries on Tags including usage count aggregation.
 */

import type { InferSelectModel } from "drizzle-orm";
import { count, desc, eq, isNull } from "drizzle-orm";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Tag, TagWithUsage } from "@/core/domain/tag/entity";
import type { TagQueryService } from "@/core/domain/tag/ports/tagQueryService";
import { createTagId } from "@/core/domain/tag/valueObject";
import type { Executor } from "./client";
import { noteTagRelations, tags } from "./schema";

type TagDataModel = InferSelectModel<typeof tags>;

export class DrizzleSqliteTagQueryService implements TagQueryService {
  constructor(private readonly executor: Executor) {}

  /**
   * Convert database row to Tag entity
   */
  private into(data: TagDataModel): Tag {
    return {
      id: createTagId(data.id),
      name: data.name as Tag["name"],
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }

  async findAllWithUsage(): Promise<TagWithUsage[]> {
    try {
      // LEFT JOIN with noteTagRelations to calculate usage count
      const result = await this.executor
        .select({
          id: tags.id,
          name: tags.name,
          createdAt: tags.createdAt,
          updatedAt: tags.updatedAt,
          usageCount: count(noteTagRelations.noteId),
        })
        .from(tags)
        .leftJoin(noteTagRelations, eq(tags.id, noteTagRelations.tagId))
        .groupBy(tags.id)
        .orderBy(desc(count(noteTagRelations.noteId)));

      return result.map((r) => ({
        id: createTagId(r.id),
        name: r.name as Tag["name"],
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        usageCount: r.usageCount,
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
      const result = await this.executor
        .select({
          id: tags.id,
          name: tags.name,
          createdAt: tags.createdAt,
          updatedAt: tags.updatedAt,
        })
        .from(tags)
        .leftJoin(noteTagRelations, eq(tags.id, noteTagRelations.tagId))
        .where(isNull(noteTagRelations.noteId))
        .groupBy(tags.id);

      return result.map((r) => this.into(r));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find unused tags",
        error,
      );
    }
  }
}
