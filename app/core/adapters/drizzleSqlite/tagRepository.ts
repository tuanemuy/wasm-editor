/**
 * Drizzle SQLite Tag Repository Adapter
 *
 * Implements TagRepository port using Drizzle ORM and SQLite.
 * Handles Tag aggregate persistence.
 */

import type { InferSelectModel } from "drizzle-orm";
import { count, eq, inArray } from "drizzle-orm";
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
import type { Executor } from "./client";
import { tags } from "./schema";

type TagDataModel = InferSelectModel<typeof tags>;

export class DrizzleSqliteTagRepository implements TagRepository {
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

  async save(tag: Tag): Promise<void> {
    try {
      await this.executor
        .insert(tags)
        .values({
          id: tag.id,
          name: tag.name,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt,
        })
        .onConflictDoUpdate({
          target: tags.id,
          set: {
            name: tag.name,
            updatedAt: tag.updatedAt,
          },
        });
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
      const result = await this.executor
        .select()
        .from(tags)
        .where(eq(tags.name, name))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return this.into(result[0]);
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
      const result = await this.executor
        .select()
        .from(tags)
        .where(eq(tags.id, id))
        .limit(1);

      if (result.length === 0) {
        throw new NotFoundError(
          NotFoundErrorCode.TagNotFound,
          `Tag not found: ${id}`,
        );
      }

      return this.into(result[0]);
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
      const result = await this.executor
        .select()
        .from(tags)
        .where(inArray(tags.id, ids));

      return result.map((r) => this.into(r));
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
      const result = await this.executor.select().from(tags);

      return result.map((r) => this.into(r));
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
      await this.executor.delete(tags).where(eq(tags.id, id));
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
      await this.executor.delete(tags).where(inArray(tags.id, ids));
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
      const result = await this.executor
        .select({ count: count() })
        .from(tags)
        .where(eq(tags.id, id));

      return result[0].count > 0;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to check tag existence",
        error,
      );
    }
  }
}
