import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";
import { NotFoundError, NotFoundErrorCode } from "../error";
import { deleteRevisionsByNote } from "../revision/deleteRevisionsByNote";
import { deleteTagsByNote } from "../tag/deleteTagsByNote";

export type DeleteNoteInput = {
  id: NoteId;
};

export async function deleteNote(
  context: Context,
  input: DeleteNoteInput,
): Promise<void> {
  // Check if note exists
  const note = await context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.noteRepository.findById(input.id);
  });

  if (!note) {
    throw new NotFoundError(NotFoundErrorCode.NotFound, "Note not found");
  }

  // Delete tags relations
  await deleteTagsByNote(context, { noteId: input.id });

  // Delete revisions
  await deleteRevisionsByNote(context, { noteId: input.id });

  // Delete note
  await context.unitOfWorkProvider.run(async (repositories) => {
    await repositories.noteRepository.delete(input.id);
  });
}
