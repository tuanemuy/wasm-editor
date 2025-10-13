import type { NoteId } from "@/core/domain/note/valueObject";
import { createTagName } from "@/core/domain/tag/valueObject";
import type { Context } from "../context";
import { NotFoundError, NotFoundErrorCode } from "../error";

export type FindNoteIdsByTagInput = {
  tagName: string;
};

export async function findNoteIdsByTag(
  context: Context,
  input: FindNoteIdsByTagInput,
): Promise<NoteId[]> {
  const tagName = createTagName(input.tagName);

  const noteIds = await context.unitOfWorkProvider.run(async (repositories) => {
    // Find tag
    const tag = await repositories.tagRepository.findByName(tagName);
    if (!tag) {
      throw new NotFoundError(NotFoundErrorCode.NotFound, "Tag not found");
    }

    // Find note IDs
    return await repositories.noteTagRelationRepository.findNotesByTag(tag.id);
  });

  return noteIds;
}
