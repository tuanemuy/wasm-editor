/**
 * Search Notes by Tag Use Case
 *
 * Searches notes by a single tag ID.
 * Returns paginated results with sorting.
 */
import type { Note } from "@/core/domain/note/entity";
import type { OrderBy, SortOrder } from "@/core/domain/note/valueObject";
import type { TagId } from "@/core/domain/tag/valueObject";
import type { Pagination, PaginationResult } from "@/lib/pagination";
import type { Context } from "../context";

export type SearchNotesByTagInput = {
  tagId: TagId;
  pagination: Pagination;
  order: SortOrder;
  orderBy: OrderBy;
};

export async function searchNotesByTag(
  context: Context,
  input: SearchNotesByTagInput,
): Promise<PaginationResult<Note>> {
  return await context.noteQueryService.combinedSearch({
    query: "",
    tagIds: [input.tagId],
    pagination: input.pagination,
    order: input.order,
    orderBy: input.orderBy,
  });
}
