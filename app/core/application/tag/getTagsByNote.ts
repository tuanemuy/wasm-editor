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
  const tags = await context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.noteTagRelationRepository.findTagsByNote(
      input.noteId,
    );
  });

  return tags;
}
