/**
 * LocalStorage Note Repository Adapter
 *
 * Implements NoteRepository port using browser localStorage API.
 * Stores notes as JSON objects in localStorage.
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
  StructuredContent,
} from "@/core/domain/note/valueObject";
import {
  createNoteContent,
  createNoteId,
  createText,
} from "@/core/domain/note/valueObject";
import { createTagId } from "@/core/domain/tag/valueObject";
import type { Pagination, PaginationResult } from "@/lib/pagination";

const NOTES_STORAGE_KEY = "app_notes";
const NOTE_TAG_RELATIONS_STORAGE_KEY = "app_note_tag_relations";

interface NoteDataModel {
  id: string;
  content: string; // JSON string
  text: string;
  created_at: number; // Unix timestamp (milliseconds)
  updated_at: number; // Unix timestamp (milliseconds)
}

interface NoteTagRelation {
  note_id: string;
  tag_id: string;
}

export class LocalStorageNoteRepository implements NoteRepository {
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
   * Save all notes to localStorage
   */
  private saveAllNotes(notes: Map<string, NoteDataModel>): void {
    try {
      const obj = Object.fromEntries(notes);
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(obj));
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to save notes to localStorage",
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
   * Save all note-tag relations to localStorage
   */
  private saveAllRelations(relations: NoteTagRelation[]): void {
    try {
      localStorage.setItem(
        NOTE_TAG_RELATIONS_STORAGE_KEY,
        JSON.stringify(relations),
      );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to save note-tag relations to localStorage",
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
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async save(note: Note): Promise<void> {
    try {
      const notes = this.getAllNotes();

      // Serialize content to JSON string
      const contentJson = JSON.stringify(note.content);

      // Save note
      notes.set(note.id, {
        id: note.id,
        content: contentJson,
        text: note.text,
        created_at: note.createdAt.getTime(),
        updated_at: note.updatedAt.getTime(),
      });

      this.saveAllNotes(notes);

      // Update tag relations
      const relations = this.getAllRelations();
      const filteredRelations = relations.filter((r) => r.note_id !== note.id);
      const newRelations = note.tagIds.map((tagId) => ({
        note_id: note.id,
        tag_id: tagId,
      }));

      this.saveAllRelations([...filteredRelations, ...newRelations]);
    } catch (error) {
      if (error instanceof SystemError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to save note",
        error,
      );
    }
  }

  async findById(id: NoteId): Promise<Note> {
    try {
      const notes = this.getAllNotes();
      const data = notes.get(id);

      if (!data) {
        throw new NotFoundError(
          NotFoundErrorCode.NoteNotFound,
          `Note not found: ${id}`,
        );
      }

      return await this.into(data);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.StorageError,
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

    try {
      const notes = this.getAllNotes();
      let notesArray = Array.from(notes.values());

      // Sort
      const sortField = orderBy === "created_at" ? "created_at" : "updated_at";
      notesArray.sort((a, b) => {
        const diff = a[sortField] - b[sortField];
        return order === "asc" ? diff : -diff;
      });

      // Paginate
      const total = notesArray.length;
      const offset = (pagination.page - 1) * pagination.limit;
      const paginatedData = notesArray.slice(
        offset,
        offset + pagination.limit,
      );

      const noteEntities = await Promise.all(
        paginatedData.map((data) => this.into(data)),
      );

      return {
        items: noteEntities,
        count: total,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to find notes",
        error,
      );
    }
  }

  async delete(id: NoteId): Promise<void> {
    try {
      const exists = await this.exists(id);
      if (!exists) {
        throw new NotFoundError(
          NotFoundErrorCode.NoteNotFound,
          `Note not found: ${id}`,
        );
      }

      // Delete note
      const notes = this.getAllNotes();
      notes.delete(id);
      this.saveAllNotes(notes);

      // Delete tag relations
      const relations = this.getAllRelations();
      const filteredRelations = relations.filter((r) => r.note_id !== id);
      this.saveAllRelations(filteredRelations);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to delete note",
        error,
      );
    }
  }

  async exists(id: NoteId): Promise<boolean> {
    try {
      const notes = this.getAllNotes();
      return notes.has(id);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.StorageError,
        "Failed to check note existence",
        error,
      );
    }
  }
}
