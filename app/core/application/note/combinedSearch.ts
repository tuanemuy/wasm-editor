import type { Note } from "@/core/domain/note/entity";
import type {
  PaginationParams,
  SearchQuery,
  SortOrder,
} from "@/core/domain/note/valueObject";
import type { Context } from "../context";

export type CombinedSearchInput = {
  query: SearchQuery;
  tagNames: string[];
  sortOrder: SortOrder;
  pagination: PaginationParams;
};

export async function combinedSearch(
  context: Context,
  input: CombinedSearchInput,
): Promise<Note[]> {
  const notes = await context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.noteRepository.searchWithTags(
      input.query,
      input.tagNames,
      {
        sortOrder: input.sortOrder,
        pagination: input.pagination,
      },
    );
  });

  return notes;
}
