import type { NoteId } from "@/core/domain/note/valueObject";
import { createTagName } from "@/core/domain/tag/valueObject";
import type { Context } from "../context";

export type FindNoteIdsByTagsInput = {
  tagNames: string[];
};

export async function findNoteIdsByTags(
  context: Context,
  input: FindNoteIdsByTagsInput,
): Promise<NoteId[]> {
  const tagNames = input.tagNames.map((name) => createTagName(name));

  const noteIds = await context.unitOfWorkProvider.run(async (repositories) => {
    // Find tags
    const tags = await repositories.tagRepository.findByNames(tagNames);

    // If any tag doesn't exist, return empty list
    if (tags.length !== tagNames.length) {
      return [];
    }

    // Find note IDs (AND search)
    const tagIds = tags.map((tag) => tag.id);
    return await repositories.noteTagRelationRepository.findNotesByTags(tagIds);
  });

  return noteIds;
}
