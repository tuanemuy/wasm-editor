/**
 * Update Note Use Case
 *
 * Updates an existing note's content.
 */

import type { Note } from "@/core/domain/note/entity";
import { updateContent } from "@/core/domain/note/entity";
import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";

export type UpdateNoteInput = {
  id: NoteId;
  content: string;
};

export async function updateNote(
  context: Context,
  input: UpdateNoteInput,
): Promise<Note> {
  return await context.unitOfWorkProvider.run(async (repositories) => {
    // Find existing note
    const note = await repositories.noteRepository.findById(input.id);

    // Update content (validates content)
    const updatedNote = updateContent(note, input.content);

    // Save updated note
    await repositories.noteRepository.save(updatedNote);

    return updatedNote;
  });
}
