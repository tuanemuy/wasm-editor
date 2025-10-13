import { err, ok, type Result } from "neverthrow";
import type { Revision } from "@/core/domain/revision/entity";
import { createRevision } from "@/core/domain/revision/entity";
import type { NoteContent, NoteId } from "@/core/domain/revision/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type SaveRevisionInput = {
  noteId: NoteId;
  content: NoteContent;
};

export async function saveRevision(
  context: Context,
  input: SaveRevisionInput,
): Promise<Result<Revision, ApplicationError>> {
  const revisionResult = createRevision({
    noteId: input.noteId,
    content: input.content,
  });

  if (revisionResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to save revision",
        revisionResult.error,
      ),
    );
  }

  const createResult = await context.revisionRepository.create(
    revisionResult.value,
  );

  if (createResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to save revision",
        createResult.error,
      ),
    );
  }

  return ok(createResult.value);
}
