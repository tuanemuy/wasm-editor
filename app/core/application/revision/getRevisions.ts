import type { NoteId } from "@/core/domain/note/valueObject";
import type { Revision } from "@/core/domain/revision/entity";
import type { Context } from "../context";
import { NotFoundError, NotFoundErrorCode } from "../error";

export type GetRevisionsInput = {
  noteId: NoteId;
  pagination?: {
    offset: number;
    limit: number;
  };
};

export type GetRevisionsOutput = {
  revisions: Revision[];
  total: number;
};

export async function getRevisions(
  context: Context,
  input: GetRevisionsInput,
): Promise<GetRevisionsOutput> {
  // Check if note exists
  const note = await context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.noteRepository.findById(input.noteId);
  });

  if (!note) {
    throw new NotFoundError(NotFoundErrorCode.NotFound, "Note not found");
  }

  // Get revisions
  const [revisions, total] = await context.unitOfWorkProvider.run(
    async (repositories) => {
      let revisions: Revision[];
      if (input.pagination) {
        revisions =
          await repositories.revisionRepository.findByNoteIdWithPagination(
            input.noteId,
            input.pagination,
          );
      } else {
        revisions = await repositories.revisionRepository.findByNoteId(
          input.noteId,
        );
      }
      const total = await repositories.revisionRepository.countByNoteId(
        input.noteId,
      );
      return [revisions, total] as const;
    },
  );

  return { revisions, total };
}
