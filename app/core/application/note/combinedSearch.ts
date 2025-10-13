import { err, ok, type Result } from "neverthrow";
import type { Note } from "@/core/domain/note/entity";
import type { Pagination } from "@/core/domain/note/ports/noteRepository";
import type { SortBy, TagName } from "@/core/domain/note/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type CombinedSearchInput = {
  query: string;
  tags: TagName[];
  pagination: Pagination;
  sortBy: SortBy;
};

export async function combinedSearch(
  context: Context,
  input: CombinedSearchInput,
): Promise<Result<{ items: Note[]; count: number }, ApplicationError>> {
  const result = await context.noteRepository.combinedSearch(
    input.query,
    input.tags,
    input.pagination,
    input.sortBy,
  );

  if (result.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to perform combined search",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
