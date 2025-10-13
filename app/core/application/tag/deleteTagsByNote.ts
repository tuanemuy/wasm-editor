import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";

export type DeleteTagsByNoteInput = {
  noteId: NoteId;
};

export async function deleteTagsByNote(
  context: Context,
  input: DeleteTagsByNoteInput,
): Promise<void> {
  await context.unitOfWorkProvider.run(async (repositories) => {
    // Find tags related to the note
    const tags = await repositories.noteTagRelationRepository.findTagsByNote(
      input.noteId,
    );

    // Decrement usage count for each tag
    for (const tag of tags) {
      await repositories.tagRepository.decrementUsageCount(tag.id);
    }

    // Remove all relations
    await repositories.noteTagRelationRepository.removeAllRelationsByNote(
      input.noteId,
    );

    // Delete unused tags
    await repositories.tagRepository.deleteUnusedTags();
  });
}
