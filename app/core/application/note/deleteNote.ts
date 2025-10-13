/**
 * Delete Note Use Case
 *
 * Deletes an existing note by ID.
 */
import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";

export type DeleteNoteInput = {
  id: NoteId;
};

export async function deleteNote(
  context: Context,
  input: DeleteNoteInput,
): Promise<void> {
  await context.unitOfWorkProvider.run(async (repositories) => {
    // Delete note (will throw NotFoundError if not found)
    await repositories.noteRepository.delete(input.id);
  });
}
