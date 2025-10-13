import type { InferSelectModel } from "drizzle-orm";
import { and, eq, inArray, sql } from "drizzle-orm";
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { NoteId } from "@/core/domain/note/valueObject";
import type { Tag } from "@/core/domain/tag/entity";
import type { NoteTagRelationRepository } from "@/core/domain/tag/ports/noteTagRelationRepository";
import type { TagId, TagName, UsageCount } from "@/core/domain/tag/valueObject";
import type { Executor } from "./client";
import { noteTags, tags } from "./schema";

type TagDataModel = InferSelectModel<typeof tags>;

export class DrizzleSqliteNoteTagRelationRepository
  implements NoteTagRelationRepository
{
  constructor(private readonly executor: Executor) {}

  private intoTag(data: TagDataModel): Tag {
    return {
      id: data.id as TagId,
      name: data.name as TagName,
      usageCount: data.usageCount as UsageCount,
    };
  }

  async addRelation(noteId: NoteId, tagId: TagId): Promise<void> {
    try {
      await this.executor.insert(noteTags).values({
        noteId,
        tagId,
      });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to add note-tag relation",
        error,
      );
    }
  }

  async removeRelation(noteId: NoteId, tagId: TagId): Promise<void> {
    try {
      await this.executor
        .delete(noteTags)
        .where(and(eq(noteTags.noteId, noteId), eq(noteTags.tagId, tagId)));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to remove note-tag relation",
        error,
      );
    }
  }

  async removeAllRelationsByNote(noteId: NoteId): Promise<void> {
    try {
      await this.executor.delete(noteTags).where(eq(noteTags.noteId, noteId));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to remove all relations by note",
        error,
      );
    }
  }

  async findTagsByNote(noteId: NoteId): Promise<Tag[]> {
    try {
      const result = await this.executor
        .select({
          id: tags.id,
          name: tags.name,
          usageCount: tags.usageCount,
        })
        .from(noteTags)
        .innerJoin(tags, eq(noteTags.tagId, tags.id))
        .where(eq(noteTags.noteId, noteId));

      return result.map((row) => this.intoTag(row));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find tags by note",
        error,
      );
    }
  }

  async findNotesByTag(tagId: TagId): Promise<NoteId[]> {
    try {
      const result = await this.executor
        .select({ noteId: noteTags.noteId })
        .from(noteTags)
        .where(eq(noteTags.tagId, tagId));

      return result.map((row) => row.noteId as NoteId);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find notes by tag",
        error,
      );
    }
  }

  async findNotesByTags(tagIds: TagId[]): Promise<NoteId[]> {
    try {
      if (tagIds.length === 0) {
        return [];
      }

      // Find note IDs that have all the specified tags (AND search)
      const result = await this.executor
        .select({ noteId: noteTags.noteId })
        .from(noteTags)
        .where(inArray(noteTags.tagId, tagIds))
        .groupBy(noteTags.noteId)
        .having(sql`count(DISTINCT ${noteTags.tagId}) = ${tagIds.length}`);

      return result.map((row) => row.noteId as NoteId);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.DatabaseError,
        "Failed to find notes by tags",
        error,
      );
    }
  }
}
