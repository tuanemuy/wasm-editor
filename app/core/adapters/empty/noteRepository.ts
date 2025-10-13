/**
 * Empty Note Repository
 *
 * Stub implementation for testing purposes.
 * Use vi.spyOn to mock methods in tests.
 */

import type { Note } from "@/core/domain/note/entity";
import type { NoteRepository } from "@/core/domain/note/ports/noteRepository";
import type {
  NoteId,
  OrderBy,
  SortOrder,
} from "@/core/domain/note/valueObject";
import type { Pagination, PaginationResult } from "@/lib/pagination";

export class EmptyNoteRepository implements NoteRepository {
  async save(_note: Note): Promise<void> {
    // Stub implementation
  }

  async findById(_id: NoteId): Promise<Note> {
    throw new Error("Not implemented");
  }

  async findAll(_params: {
    pagination: Pagination;
    order: SortOrder;
    orderBy: OrderBy;
  }): Promise<PaginationResult<Note>> {
    throw new Error("Not implemented");
  }

  async delete(_id: NoteId): Promise<void> {
    // Stub implementation
  }

  async exists(_id: NoteId): Promise<boolean> {
    throw new Error("Not implemented");
  }
}
