import { and, asc, desc, eq, inArray, like, sql } from "drizzle-orm";
import { err, ok, type Result } from "neverthrow";
import { type Note, reconstructNote } from "@/core/domain/note/entity";
import type {
  NoteRepository,
  Pagination,
} from "@/core/domain/note/ports/noteRepository";
import type { NoteId, SortBy, TagName } from "@/core/domain/note/valueObject";
import { RepositoryError } from "@/core/error/adapter";
import type { Executor } from "./client";
import { notes, noteTags, tags } from "./schema";

export class DrizzleSqliteNoteRepository implements NoteRepository {
  constructor(private readonly executor: Executor) {}

  async create(note: Note): Promise<Result<Note, RepositoryError>> {
    try {
      // Insert note
      await this.executor.insert(notes).values({
        id: note.id,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      });

      // Insert tags if any
      if (note.tags.length > 0) {
        // Insert tags (ignore if already exists)
        await this.executor
          .insert(tags)
          .values(note.tags.map((tag) => ({ name: tag })))
          .onConflictDoNothing();

        // Insert note-tag relationships
        await this.executor
          .insert(noteTags)
          .values(note.tags.map((tag) => ({ noteId: note.id, tagName: tag })));
      }

      return ok(note);
    } catch (error) {
      return err(new RepositoryError("Failed to create note", error));
    }
  }

  async findById(id: NoteId): Promise<Result<Note | null, RepositoryError>> {
    try {
      // Find note
      const noteResult = await this.executor
        .select()
        .from(notes)
        .where(eq(notes.id, id))
        .limit(1);

      if (noteResult.length === 0) {
        return ok(null);
      }

      const noteData = noteResult[0];

      // Find associated tags
      const tagsResult = await this.executor
        .select({ name: tags.name })
        .from(noteTags)
        .innerJoin(tags, eq(noteTags.tagName, tags.name))
        .where(eq(noteTags.noteId, id));

      const tagNames = tagsResult.map((t) => t.name);

      return reconstructNote({
        id: noteData.id,
        content: noteData.content,
        tags: tagNames,
        createdAt: noteData.createdAt,
        updatedAt: noteData.updatedAt,
      }).mapErr((error) => new RepositoryError("Invalid note data", error));
    } catch (error) {
      return err(new RepositoryError("Failed to find note", error));
    }
  }

  async findAll(
    pagination: Pagination,
    sortBy: SortBy,
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>> {
    try {
      const limit = pagination.limit;
      const offset = (pagination.page - 1) * pagination.limit;

      // Build sort order
      const orderBy = this.buildOrderBy(sortBy);

      // Get notes
      const notesResult = await this.executor
        .select()
        .from(notes)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      // Get total count
      const countResult = await this.executor
        .select({ count: sql<number>`count(*)` })
        .from(notes);

      const count = countResult[0]?.count ?? 0;

      // Get tags for all notes
      const noteIds = notesResult.map((n) => n.id);
      const tagsMap = await this.getTagsForNotes(noteIds);

      // Reconstruct notes
      const items = notesResult
        .map((noteData) => {
          const tagNames = tagsMap.get(noteData.id) ?? [];
          return reconstructNote({
            id: noteData.id,
            content: noteData.content,
            tags: tagNames,
            createdAt: noteData.createdAt,
            updatedAt: noteData.updatedAt,
          }).unwrapOr(null);
        })
        .filter((note): note is Note => note !== null);

      return ok({ items, count });
    } catch (error) {
      return err(new RepositoryError("Failed to find all notes", error));
    }
  }

  async update(note: Note): Promise<Result<Note, RepositoryError>> {
    try {
      // Update note
      await this.executor
        .update(notes)
        .set({
          content: note.content,
          updatedAt: note.updatedAt,
        })
        .where(eq(notes.id, note.id));

      // Delete existing note-tag relationships
      await this.executor.delete(noteTags).where(eq(noteTags.noteId, note.id));

      // Insert new tags and relationships
      if (note.tags.length > 0) {
        // Insert tags (ignore if already exists)
        await this.executor
          .insert(tags)
          .values(note.tags.map((tag) => ({ name: tag })))
          .onConflictDoNothing();

        // Insert note-tag relationships
        await this.executor
          .insert(noteTags)
          .values(note.tags.map((tag) => ({ noteId: note.id, tagName: tag })));
      }

      return ok(note);
    } catch (error) {
      return err(new RepositoryError("Failed to update note", error));
    }
  }

  async delete(id: NoteId): Promise<Result<void, RepositoryError>> {
    try {
      await this.executor.delete(notes).where(eq(notes.id, id));
      return ok(undefined);
    } catch (error) {
      return err(new RepositoryError("Failed to delete note", error));
    }
  }

  async search(
    query: string,
    pagination: Pagination,
    sortBy: SortBy,
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>> {
    try {
      const limit = pagination.limit;
      const offset = (pagination.page - 1) * pagination.limit;

      // Build sort order
      const orderBy = this.buildOrderBy(sortBy);

      // Search notes by content
      const searchPattern = `%${query}%`;
      const notesResult = await this.executor
        .select()
        .from(notes)
        .where(like(notes.content, searchPattern))
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      // Get total count
      const countResult = await this.executor
        .select({ count: sql<number>`count(*)` })
        .from(notes)
        .where(like(notes.content, searchPattern));

      const count = countResult[0]?.count ?? 0;

      // Get tags for all notes
      const noteIds = notesResult.map((n) => n.id);
      const tagsMap = await this.getTagsForNotes(noteIds);

      // Reconstruct notes
      const items = notesResult
        .map((noteData) => {
          const tagNames = tagsMap.get(noteData.id) ?? [];
          return reconstructNote({
            id: noteData.id,
            content: noteData.content,
            tags: tagNames,
            createdAt: noteData.createdAt,
            updatedAt: noteData.updatedAt,
          }).unwrapOr(null);
        })
        .filter((note): note is Note => note !== null);

      return ok({ items, count });
    } catch (error) {
      return err(new RepositoryError("Failed to search notes", error));
    }
  }

  async findByTags(
    tagNames: TagName[],
    pagination: Pagination,
    sortBy: SortBy,
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>> {
    try {
      if (tagNames.length === 0) {
        return this.findAll(pagination, sortBy);
      }

      const limit = pagination.limit;
      const offset = (pagination.page - 1) * pagination.limit;

      // Build sort order
      const orderBy = this.buildOrderBy(sortBy);

      // Find notes with all specified tags (AND search)
      const notesResult = await this.executor
        .select({
          id: notes.id,
          content: notes.content,
          createdAt: notes.createdAt,
          updatedAt: notes.updatedAt,
        })
        .from(notes)
        .innerJoin(noteTags, eq(notes.id, noteTags.noteId))
        .where(inArray(noteTags.tagName, tagNames))
        .groupBy(notes.id)
        .having(sql`COUNT(DISTINCT ${noteTags.tagName}) = ${tagNames.length}`)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      // Get total count
      const countResult = await this.executor
        .select({ count: sql<number>`count(DISTINCT ${notes.id})` })
        .from(notes)
        .innerJoin(noteTags, eq(notes.id, noteTags.noteId))
        .where(inArray(noteTags.tagName, tagNames))
        .having(sql`COUNT(DISTINCT ${noteTags.tagName}) = ${tagNames.length}`);

      const count = countResult[0]?.count ?? 0;

      // Get tags for all notes
      const noteIds = notesResult.map((n) => n.id);
      const tagsMap = await this.getTagsForNotes(noteIds);

      // Reconstruct notes
      const items = notesResult
        .map((noteData) => {
          const tagNamesForNote = tagsMap.get(noteData.id) ?? [];
          return reconstructNote({
            id: noteData.id,
            content: noteData.content,
            tags: tagNamesForNote,
            createdAt: noteData.createdAt,
            updatedAt: noteData.updatedAt,
          }).unwrapOr(null);
        })
        .filter((note): note is Note => note !== null);

      return ok({ items, count });
    } catch (error) {
      return err(new RepositoryError("Failed to find notes by tags", error));
    }
  }

  async combinedSearch(
    query: string,
    tagNames: TagName[],
    pagination: Pagination,
    sortBy: SortBy,
  ): Promise<Result<{ items: Note[]; count: number }, RepositoryError>> {
    try {
      const limit = pagination.limit;
      const offset = (pagination.page - 1) * pagination.limit;

      // Build sort order
      const orderBy = this.buildOrderBy(sortBy);

      // Search pattern
      const searchPattern = `%${query}%`;

      // Combined search: full-text + tag filtering
      if (tagNames.length === 0) {
        // No tag filtering, just full-text search
        const notesResult = await this.executor
          .select({
            id: notes.id,
            content: notes.content,
            createdAt: notes.createdAt,
            updatedAt: notes.updatedAt,
          })
          .from(notes)
          .where(like(notes.content, searchPattern))
          .orderBy(orderBy)
          .limit(limit)
          .offset(offset);

        const countResult = await this.executor
          .select({ count: sql<number>`count(*)` })
          .from(notes)
          .where(like(notes.content, searchPattern));

        const count = countResult[0]?.count ?? 0;

        // Get tags for all notes
        const noteIds = notesResult.map((n) => n.id);
        const tagsMap = await this.getTagsForNotes(noteIds);

        // Reconstruct notes
        const items = notesResult
          .map((noteData) => {
            const tagNamesForNote = tagsMap.get(noteData.id) ?? [];
            return reconstructNote({
              id: noteData.id,
              content: noteData.content,
              tags: tagNamesForNote,
              createdAt: noteData.createdAt,
              updatedAt: noteData.updatedAt,
            }).unwrapOr(null);
          })
          .filter((note): note is Note => note !== null);

        return ok({ items, count });
      }

      // With tag filtering
      const notesResult = await this.executor
        .select({
          id: notes.id,
          content: notes.content,
          createdAt: notes.createdAt,
          updatedAt: notes.updatedAt,
        })
        .from(notes)
        .innerJoin(noteTags, eq(notes.id, noteTags.noteId))
        .where(
          and(
            like(notes.content, searchPattern),
            inArray(noteTags.tagName, tagNames),
          ),
        )
        .groupBy(notes.id)
        .having(sql`COUNT(DISTINCT ${noteTags.tagName}) = ${tagNames.length}`)
        .orderBy(orderBy)
        .limit(limit)
        .offset(offset);

      const countResult = await this.executor
        .select({ count: sql<number>`count(DISTINCT ${notes.id})` })
        .from(notes)
        .innerJoin(noteTags, eq(notes.id, noteTags.noteId))
        .where(
          and(
            like(notes.content, searchPattern),
            inArray(noteTags.tagName, tagNames),
          ),
        )
        .having(sql`COUNT(DISTINCT ${noteTags.tagName}) = ${tagNames.length}`);

      const count = countResult[0]?.count ?? 0;

      // Get tags for all notes
      const noteIds = notesResult.map((n) => n.id);
      const tagsMap = await this.getTagsForNotes(noteIds);

      // Reconstruct notes
      const items = notesResult
        .map((noteData) => {
          const tagNamesForNote = tagsMap.get(noteData.id) ?? [];
          return reconstructNote({
            id: noteData.id,
            content: noteData.content,
            tags: tagNamesForNote,
            createdAt: noteData.createdAt,
            updatedAt: noteData.updatedAt,
          }).unwrapOr(null);
        })
        .filter((note): note is Note => note !== null);

      return ok({ items, count });
    } catch (error) {
      return err(
        new RepositoryError("Failed to perform combined search", error),
      );
    }
  }

  /**
   * Helper method to get tags for multiple notes
   */
  private async getTagsForNotes(
    noteIds: string[],
  ): Promise<Map<string, string[]>> {
    if (noteIds.length === 0) {
      return new Map();
    }

    const tagsResult = await this.executor
      .select({
        noteId: noteTags.noteId,
        tagName: noteTags.tagName,
      })
      .from(noteTags)
      .where(inArray(noteTags.noteId, noteIds));

    const tagsMap = new Map<string, string[]>();
    for (const row of tagsResult) {
      const existing = tagsMap.get(row.noteId) ?? [];
      existing.push(row.tagName);
      tagsMap.set(row.noteId, existing);
    }

    return tagsMap;
  }

  /**
   * Helper method to build order by clause
   */
  private buildOrderBy(sortBy: SortBy) {
    switch (sortBy) {
      case "created_asc":
        return asc(notes.createdAt);
      case "created_desc":
        return desc(notes.createdAt);
      case "updated_asc":
        return asc(notes.updatedAt);
      case "updated_desc":
        return desc(notes.updatedAt);
    }
  }
}
