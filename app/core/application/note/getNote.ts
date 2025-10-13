import { err, ok, type Result } from "neverthrow";
import type { Note } from "@/core/domain/note/entity";
import type { NoteId } from "@/core/domain/note/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type GetNoteInput = {
  id: NoteId;
};

export async function getNote(
  context: Context,
  input: GetNoteInput,
): Promise<Result<Note | null, ApplicationError>> {
  const result = await context.noteRepository.findById(input.id);

  if (result.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to get note",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
