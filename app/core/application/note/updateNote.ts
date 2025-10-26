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
      tagNames = await context.tagExtractor.extractTags(updatedNote.text);
    } catch (error) {
      // Silently ignore tag extraction errors
      // TODO: Add proper logging when logging infrastructure is implemented
      console.error("Tag extraction failed:", error);
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
          } catch (error) {
            // Skip invalid tag names
            // TODO: Add proper logging when logging infrastructure is implemented
            console.error("Invalid tag name:", tagName, error);
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

    // Cleanup unused tags within the same transaction
    // This ensures atomicity and prevents race conditions
    // Uses domain service to encapsulate cleanup logic
    try {
      await context.tagCleanupService.cleanupUnused(
        context.tagQueryService,
        repositories.tagRepository,
      );
    } catch (error) {
      // Silently ignore cleanup errors to not fail the note update
      // TODO: Add proper logging when logging infrastructure is implemented
      console.error("Tag cleanup failed:", error);
    }

    return updatedNote;
  });
}
