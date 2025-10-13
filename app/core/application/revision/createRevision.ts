import type { NoteId } from "@/core/domain/note/valueObject";
import type { Revision } from "@/core/domain/revision/entity";
import { createRevision as createRevisionEntity } from "@/core/domain/revision/entity";
import type { Context } from "../context";
import { NotFoundError, NotFoundErrorCode } from "../error";

export type CreateRevisionInput = {
  noteId: NoteId;
  content: string;
  keepCount?: number; // Default: 50
};

export async function createRevision(
  context: Context,
  input: CreateRevisionInput,
): Promise<Revision> {
  const keepCount = input.keepCount || 50;

  // Check if note exists
  const note = await context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.noteRepository.findById(input.noteId);
  });

  if (!note) {
    throw new NotFoundError(NotFoundErrorCode.NotFound, "Note not found");
  }

  // Create revision
  const revision = createRevisionEntity({
    noteId: input.noteId,
    content: input.content,
  });

  // Save revision and delete old revisions
  const savedRevision = await context.unitOfWorkProvider.run(
    async (repositories) => {
      const saved = await repositories.revisionRepository.create(revision);

      // Delete old revisions if exceed keep count
      await repositories.revisionRepository.deleteOldRevisions(
        input.noteId,
        keepCount,
      );

      return saved;
    },
  );

  return savedRevision;
}
