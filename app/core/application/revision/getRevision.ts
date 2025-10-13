import { err, ok, type Result } from "neverthrow";
import type { Revision } from "@/core/domain/revision/entity";
import type { RevisionId } from "@/core/domain/revision/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type GetRevisionInput = {
  id: RevisionId;
};

export async function getRevision(
  context: Context,
  input: GetRevisionInput,
): Promise<Result<Revision | null, ApplicationError>> {
  const result = await context.revisionRepository.findById(input.id);

  if (result.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to get revision",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
