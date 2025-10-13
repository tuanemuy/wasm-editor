/**
 * Get Notes Use Case
 *
 * Retrieves a paginated list of notes with sorting.
 */
import type { Note } from "@/core/domain/note/entity";
import type { OrderBy, SortOrder } from "@/core/domain/note/valueObject";
import type { Pagination, PaginationResult } from "@/lib/pagination";
import type { Context } from "../context";

export type GetNotesInput = {
  pagination: Pagination;
  order: SortOrder;
  orderBy: OrderBy;
};

export async function getNotes(
  context: Context,
  input: GetNotesInput,
): Promise<PaginationResult<Note>> {
  return context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.noteRepository.findAll({
      pagination: input.pagination,
      order: input.order,
      orderBy: input.orderBy,
    });
  });
}
