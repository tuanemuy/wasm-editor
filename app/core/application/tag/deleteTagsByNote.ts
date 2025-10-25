/**
 * Delete Tags by Note Use Case
 *
 * Removes all tag associations from a note by setting its tagIds to empty array.
 */
import { updateTagIds } from "@/core/domain/note/entity";
import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";

export type DeleteTagsByNoteInput = {
  noteId: NoteId;
};

export async function deleteTagsByNote(
  context: Context,
  input: DeleteTagsByNoteInput,
): Promise<void> {
  await context.unitOfWorkProvider.run(async (repositories) => {
    // Find note
    const note = await repositories.noteRepository.findById(input.noteId);

    // Update note's tagIds to empty array
    const updatedNote = updateTagIds(note, []);
    await repositories.noteRepository.save(updatedNote);
  });
}
