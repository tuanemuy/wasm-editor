import { err, ok, type Result } from "neverthrow";
import type { Note } from "@/core/domain/note/entity";
import { createNote as createNoteEntity } from "@/core/domain/note/entity";
import type { NoteContent } from "@/core/domain/note/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type CreateNoteInput = {
  content: NoteContent;
};

export async function createNote(
  context: Context,
  input: CreateNoteInput,
): Promise<Result<Note, ApplicationError>> {
  const noteResult = createNoteEntity({ content: input.content });

  if (noteResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to create note",
        noteResult.error,
      ),
    );
  }

  const createResult = await context.noteRepository.create(noteResult.value);

  if (createResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to create note",
        createResult.error,
      ),
    );
  }

  return ok(createResult.value);
}
