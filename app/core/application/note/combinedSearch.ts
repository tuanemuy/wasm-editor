/**
 * Combined Search Use Case
 *
 * Searches notes using full-text search and/or tag filtering.
 * Supports AND logic for multiple tags.
 */
import type { Note } from "@/core/domain/note/entity";
import type { OrderBy, SortOrder } from "@/core/domain/note/valueObject";
import type { TagId } from "@/core/domain/tag/valueObject";
import type { Pagination, PaginationResult } from "@/lib/pagination";
import type { Container } from "../container";

export type CombinedSearchInput = {
  query: string;
  tagIds: TagId[];
  pagination: Pagination;
  order: SortOrder;
  orderBy: OrderBy;
};

export async function combinedSearch(
  container: Container,
  input: CombinedSearchInput,
): Promise<PaginationResult<Note>> {
  return await container.noteQueryService.combinedSearch({
    query: input.query,
    tagIds: input.tagIds,
    pagination: input.pagination,
    order: input.order,
    orderBy: input.orderBy,
  });
}
