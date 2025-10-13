import type { Note } from "@/core/domain/note/entity";
import type {
  PaginationParams,
  SortOrder,
} from "@/core/domain/note/valueObject";
import type { Context } from "../context";

export type GetNotesInput = {
  sortOrder: SortOrder;
  pagination: PaginationParams;
};

export type GetNotesOutput = {
  notes: Note[];
  total: number;
};

export async function getNotes(
  context: Context,
  input: GetNotesInput,
): Promise<GetNotesOutput> {
  const [notes, total] = await context.unitOfWorkProvider.run(
    async (repositories) => {
      const notes = await repositories.noteRepository.findAll({
        sortOrder: input.sortOrder,
        pagination: input.pagination,
      });
      const total = await repositories.noteRepository.count();
      return [notes, total] as const;
    },
  );

  return { notes, total };
}
