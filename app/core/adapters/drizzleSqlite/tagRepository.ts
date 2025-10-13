import { eq, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import { reconstructTag, type Tag } from "@/core/domain/note/entity";
import type { TagRepository } from "@/core/domain/note/ports/tagRepository";
import type { TagName } from "@/core/domain/note/valueObject";
import { RepositoryError } from "@/core/error/adapter";
import type { Executor } from "./client";
import { noteTags, tags } from "./schema";

export class DrizzleSqliteTagRepository implements TagRepository {
  constructor(private readonly executor: Executor) {}

  async findAll(): Promise<Result<Tag[], RepositoryError>> {
    try {
      // Get all tags with usage count
      const result = await this.executor
        .select({
          name: tags.name,
          usageCount: sql<number>`COALESCE(COUNT(${noteTags.noteId}), 0)`,
        })
        .from(tags)
        .leftJoin(noteTags, eq(tags.name, noteTags.tagName))
        .groupBy(tags.name)
        .orderBy(sql`${sql.raw("usageCount")} DESC, ${tags.name} ASC`);

      const tagList = result
        .map((row) =>
          reconstructTag({
            name: row.name,
            usageCount: row.usageCount,
          }).unwrapOr(null),
        )
        .filter((tag): tag is Tag => tag !== null);

      return ok(tagList);
    } catch (error) {
      return err(new RepositoryError("Failed to find all tags", error));
    }
  }

  async findByName(
    name: TagName,
  ): Promise<Result<Tag | null, RepositoryError>> {
    try {
      // Find tag with usage count
      const result = await this.executor
        .select({
          name: tags.name,
          usageCount: sql<number>`COALESCE(COUNT(${noteTags.noteId}), 0)`,
        })
        .from(tags)
        .leftJoin(noteTags, eq(tags.name, noteTags.tagName))
        .where(eq(tags.name, name))
        .groupBy(tags.name)
        .limit(1);

      if (result.length === 0) {
        return ok(null);
      }

      return reconstructTag({
        name: result[0].name,
        usageCount: result[0].usageCount,
      }).mapErr((error) => new RepositoryError("Invalid tag data", error));
    } catch (error) {
      return err(new RepositoryError("Failed to find tag", error));
    }
  }
}
