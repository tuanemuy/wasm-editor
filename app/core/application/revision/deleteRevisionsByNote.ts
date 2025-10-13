import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";

export type DeleteRevisionsByNoteInput = {
  noteId: NoteId;
};

export async function deleteRevisionsByNote(
  context: Context,
  input: DeleteRevisionsByNoteInput,
): Promise<void> {
  await context.unitOfWorkProvider.run(async (repositories) => {
    await repositories.revisionRepository.deleteByNoteId(input.noteId);
  });
}
