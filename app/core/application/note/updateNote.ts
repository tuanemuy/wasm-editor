/**
 * Update Note Use Case
 *
 * Updates an existing note's content.
 * Automatically extracts and syncs tags from the content.
 */

import type { Note } from "@/core/domain/note/entity";
import { updateContent, updateTagIds } from "@/core/domain/note/entity";
import type { NoteId, StructuredContent } from "@/core/domain/note/valueObject";
import type { TagId } from "@/core/domain/tag/valueObject";
import type { Context } from "../context";

export type UpdateNoteInput = {
  id: NoteId;
  content: StructuredContent;
  text: string;
};

export type UpdateNoteResult = {
  note: Note;
  tagsWereRemoved: boolean;
};

export async function updateNote(
  context: Context,
  input: UpdateNoteInput,
): Promise<UpdateNoteResult> {
  const result = await context.unitOfWorkProvider.run(async (repositories) => {
    // Find existing note
    const note = await repositories.noteRepository.findById(input.id);

    // Update content (validates content and text)
    let updatedNote = updateContent(note, input.content, input.text);

    // Extract tags from text and sync with repository using domain service
    const tags = await context.tagSyncService.extractAndSync(
      context.tagExtractorPort,
      repositories.tagRepository,
      updatedNote.text,
    );

    const tagIds: TagId[] = tags.map((tag) => tag.id);

    // Store old tag IDs for comparison
    const oldTagIds = note.tagIds;

    // Update note's tagIds
    updatedNote = updateTagIds(updatedNote, tagIds);

    // Save updated note
    await repositories.noteRepository.save(updatedNote);

    // Detect if tags were removed
    const removedTags = oldTagIds.filter((id) => !tagIds.includes(id));

    return {
      note: updatedNote,
      tagsWereRemoved: removedTags.length > 0,
    };
  });

  return result;
}
