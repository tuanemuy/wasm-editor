/**
 * Update Note Use Case
 *
 * Updates an existing note's content.
 * Automatically extracts and syncs tags from the content.
 * Cleans up unused tags after update.
 */

import type { Note } from "@/core/domain/note/entity";
import { updateContent, updateTagIds } from "@/core/domain/note/entity";
import type { NoteId, StructuredContent } from "@/core/domain/note/valueObject";
import { createTag } from "@/core/domain/tag/entity";
import type { TagId } from "@/core/domain/tag/valueObject";
import { createTagName } from "@/core/domain/tag/valueObject";
import type { Context } from "../context";
import { cleanupUnusedTags } from "../tag/cleanupUnusedTags";

export type UpdateNoteInput = {
  id: NoteId;
  content: StructuredContent;
  text: string;
};

export async function updateNote(
  context: Context,
  input: UpdateNoteInput,
): Promise<Note> {
  return await context.unitOfWorkProvider.run(async (repositories) => {
    // Find existing note
    const note = await repositories.noteRepository.findById(input.id);

    // Update content (validates content and text)
    let updatedNote = updateContent(note, input.content, input.text);

    // Extract tags from text (plain text for easier extraction)
    // If extraction fails, continue with empty tags
    let tagNames: string[] = [];
    try {
      tagNames = await context.tagExtractorPort.extractTags(updatedNote.text);
    } catch (_error) {
      // Silently ignore tag extraction errors
      // Logging strategy is a future consideration
    }

    // Get or create tags
    // Skip invalid tag names instead of failing the entire operation
    const tags = (
      await Promise.all(
        tagNames.map(async (tagName) => {
          try {
            // Validate tag name
            const validatedName = createTagName(tagName);

            // Check if tag exists
            const existingTag =
              await repositories.tagRepository.findByName(validatedName);

            if (existingTag) {
              return existingTag;
            }

            // Create new tag
            const newTag = createTag({ name: tagName });
            await repositories.tagRepository.save(newTag);
            return newTag;
          } catch (_error) {
            // Skip invalid tag names
            // Logging strategy is a future consideration
            return null;
          }
        }),
      )
    ).filter((tag) => tag !== null);

    const tagIds: TagId[] = tags.map((tag) => tag.id);

    // Update note's tagIds
    updatedNote = updateTagIds(updatedNote, tagIds);

    // Save updated note
    await repositories.noteRepository.save(updatedNote);

    return updatedNote;
  }).then(async (note) => {
    // Cleanup unused tags after transaction completes
    // This ensures tags not used by any note are removed
    try {
      await cleanupUnusedTags(context);
    } catch (_error) {
      // Silently ignore cleanup errors to not fail the note update
      // Logging strategy is a future consideration
    }
    return note;
  });
}
