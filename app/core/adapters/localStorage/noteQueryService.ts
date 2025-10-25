/**
 * LocalStorage Note Query Service Adapter
 *
 * Implements NoteQueryService port using browser localStorage API.
 * Handles complex read-only queries on Notes including full-text and tag searches.
 */

import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Note } from "@/core/domain/note/entity";
import type { NoteQueryService } from "@/core/domain/note/ports/noteQueryService";
import type {
  NoteId,
  OrderBy,
  SortOrder,
  StructuredContent,
} from "@/core/domain/note/valueObject";
import {
  createNoteContent,
  createNoteId,
  createText,
} from "@/core/domain/note/valueObject";
import type { TagId } from "@/core/domain/tag/valueObject";
import { createTagId } from "@/core/domain/tag/valueObject";
import type { Pagination, PaginationResult } from "@/lib/pagination";

const NOTES_STORAGE_KEY = "app_notes";
const NOTE_TAG_RELATIONS_STORAGE_KEY = "app_note_tag_relations";

interface NoteDataModel {
  id: string;
  content: string; // JSON string
  text: string;
  created_at: number; // Unix timestamp (seconds)
  updated_at: number; // Unix timestamp (seconds)
}

interface NoteTagRelation {
  note_id: string;
  tag_id: string;
}

export class LocalStorageNoteQueryService implements NoteQueryService {
  /**
   * Get all notes from localStorage
   */
  private getAllNotes(): Map<string, NoteDataModel> {
    try {
      const data = localStorage.getItem(NOTES_STORAGE_KEY);
      if (!data) {
        return new Map();
      }

      const parsed = JSON.parse(data) as Record<string, NoteDataModel>;
      return new Map(Object.entries(parsed));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to read notes from localStorage",
        error,
      );
    }
  }

  /**
   * Get all note-tag relations from localStorage
   */
  private getAllRelations(): NoteTagRelation[] {
    try {
      const data = localStorage.getItem(NOTE_TAG_RELATIONS_STORAGE_KEY);
      if (!data) {
        return [];
      }

      return JSON.parse(data) as NoteTagRelation[];
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to read note-tag relations from localStorage",
        error,
      );
    }
  }

  /**
   * Convert data model to Note entity
   */
  private async into(data: NoteDataModel): Promise<Note> {
    // Fetch tag IDs for this note
    const relations = this.getAllRelations();
    const tagIds = relations
      .filter((r) => r.note_id === data.id)
      .map((r) => createTagId(r.tag_id));

    // Parse JSON content
    let content: unknown;
    try {
      content = JSON.parse(data.content);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        `Failed to parse note content for note ${data.id}: ${error}`,
        error,
      );
    }

    return {
      id: createNoteId(data.id),
      content: createNoteContent(content as StructuredContent),
      text: createText(data.text),
      tagIds,
      createdAt: new Date(data.created_at * 1000),
      updatedAt: new Date(data.updated_at * 1000),
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

    try {
      const notes = this.getAllNotes();
      const relations = this.getAllRelations();
      let notesArray = Array.from(notes.values());

      // Step 1: Filter by tags (AND search)
      if (tagIds.length > 0) {
        notesArray = notesArray.filter((note) => {
          // Get tag IDs for this note
          const noteTagIds = relations
            .filter((r) => r.note_id === note.id)
            .map((r) => r.tag_id);
          const noteTagIdSet = new Set(noteTagIds);

          // Check if note has ALL specified tags
          return tagIds.every((tagId) => noteTagIdSet.has(tagId));
        });
      }

      // Step 2: Filter by full-text search
      if (query.length > 0) {
        const lowerQuery = query.toLowerCase();
        notesArray = notesArray.filter((note) =>
          note.text.toLowerCase().includes(lowerQuery),
        );
      }

      // Step 3: Sort
      const sortField = orderBy === "created_at" ? "created_at" : "updated_at";
      notesArray.sort((a, b) => {
        const diff = a[sortField] - b[sortField];
        return order === "asc" ? diff : -diff;
      });

      // Step 4: Paginate
      const total = notesArray.length;
      const offset = (pagination.page - 1) * pagination.limit;
      const paginatedData = notesArray.slice(offset, offset + pagination.limit);

      const noteEntities = await Promise.all(
        paginatedData.map((data) => this.into(data)),
      );

      return {
        items: noteEntities,
        count: total,
      };
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to search notes",
        error,
      );
    }
  }

  async findNoteIdsByTagId(tagId: TagId): Promise<NoteId[]> {
    try {
      const relations = this.getAllRelations();

      return relations
        .filter((r) => r.tag_id === tagId)
        .map((r) => createNoteId(r.note_id));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
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
      const relations = this.getAllRelations();
      const tagIdSet = new Set(tagIds);

      // Group by note_id
      const noteTagMap = new Map<string, Set<string>>();
      for (const relation of relations) {
        if (tagIdSet.has(createTagId(relation.tag_id))) {
          if (!noteTagMap.has(relation.note_id)) {
            noteTagMap.set(relation.note_id, new Set());
          }
          noteTagMap.get(relation.note_id)?.add(relation.tag_id);
        }
      }

      // AND search: notes that have ALL specified tags
      const result: NoteId[] = [];
      for (const [noteId, noteTags] of noteTagMap.entries()) {
        if (noteTags.size === tagIds.length) {
          result.push(createNoteId(noteId));
        }
      }

      return result;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to find note IDs by tag IDs",
        error,
      );
    }
  }
}
