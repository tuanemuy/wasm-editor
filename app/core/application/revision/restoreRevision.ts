import type { Note } from "@/core/domain/note/entity";
import { updateNoteBody } from "@/core/domain/note/entity";
import type { RevisionId } from "@/core/domain/revision/valueObject";
import type { Context } from "../context";
import { NotFoundError, NotFoundErrorCode } from "../error";
import { syncNoteTags } from "../tag/syncNoteTags";
import { createRevision } from "./createRevision";

export type RestoreRevisionInput = {
  revisionId: RevisionId;
};

export async function restoreRevision(
  context: Context,
  input: RestoreRevisionInput,
): Promise<Note> {
  // Get revision
  const revision = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.revisionRepository.findById(input.revisionId);
    },
  );

  if (!revision) {
    throw new NotFoundError(NotFoundErrorCode.NotFound, "Revision not found");
  }

  // Get note
  const note = await context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.noteRepository.findById(revision.noteId);
  });

  if (!note) {
    throw new NotFoundError(NotFoundErrorCode.NotFound, "Note not found");
  }

  // Sync tags with restored content
  const tags = await syncNoteTags(context, {
    noteId: revision.noteId,
    content: revision.content,
  });

  // Update note with revision content
  const updatedNote = updateNoteBody(note, {
    body: revision.content,
    tags,
  });

  // Save updated note
  const savedNote = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.noteRepository.update(updatedNote);
    },
  );

  // Create new revision after restore (MANUAL trigger)
  await createRevision(context, {
    noteId: savedNote.id,
    content: savedNote.body,
  });

  return savedNote;
}
