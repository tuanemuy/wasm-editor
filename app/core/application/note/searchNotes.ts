import type { Note } from "@/core/domain/note/entity";
import type {
  PaginationParams,
  SearchQuery,
  SortOrder,
} from "@/core/domain/note/valueObject";
import type { Context } from "../context";

export type SearchNotesInput = {
  query: SearchQuery;
  sortOrder: SortOrder;
  pagination: PaginationParams;
};

export async function searchNotes(
  context: Context,
  input: SearchNotesInput,
): Promise<Note[]> {
  const notes = await context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.noteRepository.search(input.query, {
      sortOrder: input.sortOrder,
      pagination: input.pagination,
    });
  });

  return notes;
}
