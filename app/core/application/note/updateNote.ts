import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import type { Note } from "@/core/domain/note/entity";
import { updateNoteContent } from "@/core/domain/note/entity";
import type { NoteContent, NoteId } from "@/core/domain/note/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type UpdateNoteInput = {
  id: NoteId;
  content: NoteContent;
};

export async function updateNote(
  context: Context,
  input: UpdateNoteInput,
): Promise<Result<Note, ApplicationError>> {
  // Get existing note
  const noteResult = await context.noteRepository.findById(input.id);

  if (noteResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to update note",
        noteResult.error,
      ),
    );
  }

  const note = noteResult.value;
  if (note === null) {
    return err(
      new ApplicationError(ApplicationErrorCode.NOT_FOUND, "Note not found"),
    );
  }

  // Update note content
  const updatedNoteResult = updateNoteContent(note, input.content);

  if (updatedNoteResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to update note",
        updatedNoteResult.error,
      ),
    );
  }

  const updateResult = await context.noteRepository.update(
    updatedNoteResult.value,
  );

  if (updateResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to update note",
        updateResult.error,
      ),
    );
  }

  return ok(updateResult.value);
}
