import { err, ok, type Result } from "neverthrow";
import type { Revision } from "@/core/domain/revision/entity";
import type { NoteId } from "@/core/domain/revision/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type GetRevisionsInput = {
  noteId: NoteId;
};

export async function getRevisions(
  context: Context,
  input: GetRevisionsInput,
): Promise<Result<Revision[], ApplicationError>> {
  const result = await context.revisionRepository.findByNoteId(input.noteId);

  if (result.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to get revisions",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
