import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import type { Note } from "@/core/domain/note/entity";
import { updateNoteContent } from "@/core/domain/note/entity";
import type { RevisionId } from "@/core/domain/revision/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type RestoreRevisionInput = {
  revisionId: RevisionId;
};

export async function restoreRevision(
  context: Context,
  input: RestoreRevisionInput,
): Promise<Result<Note, ApplicationError>> {
  // Get revision
  const revisionResult = await context.revisionRepository.findById(
    input.revisionId,
  );

  if (revisionResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to restore revision",
        revisionResult.error,
      ),
    );
  }

  const revision = revisionResult.value;
  if (revision === null) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.NOT_FOUND,
        "Revision not found",
      ),
    );
  }

  // Get note
  const noteResult = await context.noteRepository.findById(revision.noteId);

  if (noteResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to restore revision",
        noteResult.error,
      ),
    );
  }

  const note = noteResult.value;
  if (note === null) {
    return err(
      new ApplicationError(ApplicationErrorCode.NOT_FOUND, "Note not found"),
    );
  }

  // Update note with revision content
  const updatedNoteResult = updateNoteContent(note, revision.content);

  if (updatedNoteResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to restore revision",
        updatedNoteResult.error,
      ),
    );
  }

  const updateResult = await context.noteRepository.update(
    updatedNoteResult.value,
  );

  if (updateResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to restore revision",
        updateResult.error,
      ),
    );
  }

  return ok(updateResult.value);
}
