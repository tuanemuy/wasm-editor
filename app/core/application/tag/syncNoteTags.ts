import type { NoteId } from "@/core/domain/note/valueObject";
import type { Tag } from "@/core/domain/tag/entity";
import { createTag } from "@/core/domain/tag/entity";
import type { Context } from "../context";
import { extractTagsFromContent } from "./extractTagsFromContent";

export type SyncNoteTagsInput = {
  noteId: NoteId;
  content: string;
};

export async function syncNoteTags(
  context: Context,
  input: SyncNoteTagsInput,
): Promise<Tag[]> {
  const tagNames = extractTagsFromContent(input.content);

  return await context.unitOfWorkProvider.run(async (repositories) => {
    const tags: Tag[] = [];

    // Find or create tags
    for (const tagName of tagNames) {
      let tag = await repositories.tagRepository.findByName(tagName);
      if (!tag) {
        tag = createTag({ name: tagName as string, usageCount: 0 });
        tag = await repositories.tagRepository.create(tag);
      }
      tags.push(tag);
    }

    // Remove all existing relations for this note
    await repositories.noteTagRelationRepository.removeAllRelationsByNote(
      input.noteId,
    );

    // Add new relations and increment usage count
    for (const tag of tags) {
      await repositories.noteTagRelationRepository.addRelation(
        input.noteId,
        tag.id,
      );
      await repositories.tagRepository.incrementUsageCount(tag.id);
    }

    // Delete unused tags
    await repositories.tagRepository.deleteUnusedTags();

    return tags;
  });
}
