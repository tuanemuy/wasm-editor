import type { Note } from "@/core/domain/note/entity";
import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";
import { NotFoundError, NotFoundErrorCode } from "../error";

export type GetNoteInput = {
  id: NoteId;
};

export async function getNote(
  context: Context,
  input: GetNoteInput,
): Promise<Note> {
  const note = await context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.noteRepository.findById(input.id);
  });

  if (!note) {
    throw new NotFoundError(NotFoundErrorCode.NotFound, "Note not found");
  }

  return note;
}
