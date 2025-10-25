/**
 * Sync Note Tags Use Case
 *
 * Extracts tags from note content and synchronizes them with the tag repository.
 * Creates new tags if they don't exist, and updates note's tagIds.
 */
import { updateTagIds } from "@/core/domain/note/entity";
import type { NoteId } from "@/core/domain/note/valueObject";
import { createTag } from "@/core/domain/tag/entity";
import type { TagId } from "@/core/domain/tag/valueObject";
import { createTagName } from "@/core/domain/tag/valueObject";
import type { Context } from "../context";

export type SyncNoteTagsInput = {
  noteId: NoteId;
};

export async function syncNoteTags(
  context: Context,
  input: SyncNoteTagsInput,
): Promise<TagId[]> {
  return await context.unitOfWorkProvider.run(async (repositories) => {
    // Find note
    const note = await repositories.noteRepository.findById(input.noteId);

    // Extract tags from text (plain text for easier extraction)
    // If extraction fails, continue with empty tags
    let tagNames: string[] = [];
    try {
      tagNames = await context.tagExtractorPort.extractTags(note.text);
    } catch (error) {
      // Log error in development mode but don't fail note save
      if (import.meta.env.DEV) {
        console.warn("Failed to extract tags from note text:", error);
      }
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
            // Skip invalid tag names (log only in development mode)
            if (import.meta.env.DEV) {
              console.warn(`Failed to process tag "${tagName}":`, error);
            }
            return null;
          }
        }),
      )
    ).filter((tag) => tag !== null);

    const tagIds = tags.map((tag) => tag.id);

    // Update note's tagIds
    const updatedNote = updateTagIds(note, tagIds);
    await repositories.noteRepository.save(updatedNote);

    return tagIds;
  });
}
