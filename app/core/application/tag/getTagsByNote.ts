/**
 * Get Tags by Note Use Case
 *
 * Retrieves all tags associated with a specific note.
 */

import type { NoteId } from "@/core/domain/note/valueObject";
import type { Tag } from "@/core/domain/tag/entity";
import type { Context } from "../context";

export type GetTagsByNoteInput = {
  noteId: NoteId;
};

export async function getTagsByNote(
  context: Context,
  input: GetTagsByNoteInput,
): Promise<Tag[]> {
  return context.unitOfWorkProvider.run(async (repositories) => {
    // Find note
    const note = await repositories.noteRepository.findById(input.noteId);

    // Get tags by IDs
    if (note.tagIds.length === 0) {
      return [];
    }

    return await repositories.tagRepository.findByIds(note.tagIds);
  });
}
