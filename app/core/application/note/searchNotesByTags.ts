/**
 * Search Notes by Tags Use Case
 *
 * Searches notes by multiple tag IDs using AND logic.
 * Only returns notes that have ALL specified tags.
 * Returns paginated results with sorting.
 */
import type { Note } from "@/core/domain/note/entity";
import type { OrderBy, SortOrder } from "@/core/domain/note/valueObject";
import type { TagId } from "@/core/domain/tag/valueObject";
import type { Pagination, PaginationResult } from "@/lib/pagination";
import type { Context } from "../context";

export type SearchNotesByTagsInput = {
  tagIds: TagId[];
  pagination: Pagination;
  order: SortOrder;
  orderBy: OrderBy;
};

export async function searchNotesByTags(
  context: Context,
  input: SearchNotesByTagsInput,
): Promise<PaginationResult<Note>> {
  return await context.noteQueryService.combinedSearch({
    query: "",
    tagIds: input.tagIds,
    pagination: input.pagination,
    order: input.order,
    orderBy: input.orderBy,
  });
}
