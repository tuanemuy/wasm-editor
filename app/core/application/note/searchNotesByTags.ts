import { err, ok, type Result } from "neverthrow";
import type { Note } from "@/core/domain/note/entity";
import type { Pagination } from "@/core/domain/note/ports/noteRepository";
import type { SortBy, TagName } from "@/core/domain/note/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type SearchNotesByTagsInput = {
  tags: TagName[];
  pagination: Pagination;
  sortBy: SortBy;
};

export async function searchNotesByTags(
  context: Context,
  input: SearchNotesByTagsInput,
): Promise<Result<{ items: Note[]; count: number }, ApplicationError>> {
  const result = await context.noteRepository.findByTags(
    input.tags,
    input.pagination,
    input.sortBy,
  );

  if (result.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to search notes by tags",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
