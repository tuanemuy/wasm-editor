import { err, ok, type Result } from "neverthrow";
import type { NoteId } from "@/core/domain/note/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type DeleteNoteInput = {
  id: NoteId;
};

export async function deleteNote(
  context: Context,
  input: DeleteNoteInput,
): Promise<Result<void, ApplicationError>> {
  const result = await context.noteRepository.delete(input.id);

  if (result.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to delete note",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
