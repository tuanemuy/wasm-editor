/**
 * Empty Note Query Service
 *
 * Stub implementation for testing purposes.
 * Use vi.spyOn to mock methods in tests.
 */

import type { Note } from "@/core/domain/note/entity";
import type { NoteQueryService } from "@/core/domain/note/ports/noteQueryService";
import type {
  NoteId,
  OrderBy,
  SortOrder,
} from "@/core/domain/note/valueObject";
import type { TagId } from "@/core/domain/tag/valueObject";
import type { Pagination, PaginationResult } from "@/lib/pagination";

export class EmptyNoteQueryService implements NoteQueryService {
  async combinedSearch(_params: {
    query: string;
    tagIds: TagId[];
    pagination: Pagination;
    order: SortOrder;
    orderBy: OrderBy;
  }): Promise<PaginationResult<Note>> {
    throw new Error("Not implemented");
  }

  async findNoteIdsByTagId(_tagId: TagId): Promise<NoteId[]> {
    throw new Error("Not implemented");
  }

  async findNoteIdsByTagIds(_tagIds: TagId[]): Promise<NoteId[]> {
    throw new Error("Not implemented");
  }
}
