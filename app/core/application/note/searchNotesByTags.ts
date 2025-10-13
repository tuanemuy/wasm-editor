import type { Note } from "@/core/domain/note/entity";
import type {
  PaginationParams,
  SortOrder,
} from "@/core/domain/note/valueObject";
import type { Context } from "../context";

export type SearchNotesByTagsInput = {
  tagNames: string[];
  sortOrder: SortOrder;
  pagination: PaginationParams;
};

export async function searchNotesByTags(
  context: Context,
  input: SearchNotesByTagsInput,
): Promise<Note[]> {
  const notes = await context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.noteRepository.findByTags(input.tagNames, {
      sortOrder: input.sortOrder,
      pagination: input.pagination,
    });
  });

  return notes;
}
