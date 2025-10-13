import { err, ok, type Result } from "neverthrow";
import type { Note } from "@/core/domain/note/entity";
import type { Pagination } from "@/core/domain/note/ports/noteRepository";
import type { SortBy } from "@/core/domain/note/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type SearchNotesInput = {
  query: string;
  pagination: Pagination;
  sortBy: SortBy;
};

export async function searchNotes(
  context: Context,
  input: SearchNotesInput,
): Promise<Result<{ items: Note[]; count: number }, ApplicationError>> {
  const result = await context.noteRepository.search(
    input.query,
    input.pagination,
    input.sortBy,
  );

  if (result.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to search notes",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
