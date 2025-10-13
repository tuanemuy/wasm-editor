import type { InferSelectModel } from "drizzle-orm";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Tag } from "@/core/domain/tag/entity";
import type { TagRepository } from "@/core/domain/tag/ports/tagRepository";
import type { TagId, TagName, UsageCount } from "@/core/domain/tag/valueObject";
import type { Executor } from "./client";
import { tags } from "./schema";

type TagDataModel = InferSelectModel<typeof tags>;

export class DrizzleSqliteTagRepository implements TagRepository {
  constructor(private readonly executor: Executor) {}

  private into(data: TagDataModel): Tag {
    return {
      id: data.id as TagId,
      name: data.name as TagName,
      usageCount: data.usageCount as UsageCount,
    };
  }

  async create(tag: Tag): Promise<Tag> {
    try {
      await this.executor.insert(tags).values({
        id: tag.id,
        name: tag.name,
        usageCount: tag.usageCount,
      });

      return tag;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to create tag",
        error,
      );
    }
  }

  async update(tag: Tag): Promise<Tag> {
    try {
      await this.executor
        .update(tags)
        .set({
          name: tag.name,
          usageCount: tag.usageCount,
        })
        .where(eq(tags.id, tag.id));

      return tag;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to update tag",
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

  async findById(id: TagId): Promise<Tag | null> {
    try {
      const result = await this.executor
        .select()
        .from(tags)
        .where(eq(tags.id, id))
        .limit(1);

      if (result.length === 0) {
        return null;
      }

      return this.into(result[0]);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find tag by ID",
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

  async findAll(): Promise<Tag[]> {
    try {
      const result = await this.executor
        .select()
        .from(tags)
        .orderBy(desc(tags.usageCount));

      return result.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find all tags",
        error,
      );
    }
  }

  async findByNames(names: TagName[]): Promise<Tag[]> {
    try {
      if (names.length === 0) {
        return [];
      }

      const result = await this.executor
        .select()
        .from(tags)
        .where(inArray(tags.name, names));

      return result.map((row) => this.into(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find tags by names",
        error,
      );
    }
  }

  async incrementUsageCount(id: TagId): Promise<void> {
    try {
      await this.executor
        .update(tags)
        .set({
          usageCount: sql`${tags.usageCount} + 1`,
        })
        .where(eq(tags.id, id));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to increment usage count",
        error,
      );
    }
  }

  async decrementUsageCount(id: TagId): Promise<void> {
    try {
      await this.executor
        .update(tags)
        .set({
          usageCount: sql`MAX(0, ${tags.usageCount} - 1)`,
        })
        .where(eq(tags.id, id));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to decrement usage count",
        error,
      );
    }
  }

  async deleteUnusedTags(): Promise<void> {
    try {
      await this.executor.delete(tags).where(eq(tags.usageCount, 0));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to delete unused tags",
        error,
      );
    }
  }
}
