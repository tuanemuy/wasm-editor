import type { Revision } from "@/core/domain/revision/entity";
import type { RevisionId } from "@/core/domain/revision/valueObject";
import type { Context } from "../context";
import { NotFoundError, NotFoundErrorCode } from "../error";

export type GetRevisionInput = {
  id: RevisionId;
};

export async function getRevision(
  context: Context,
  input: GetRevisionInput,
): Promise<Revision> {
  const revision = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.revisionRepository.findById(input.id);
    },
  );

  if (!revision) {
    throw new NotFoundError(NotFoundErrorCode.NotFound, "Revision not found");
  }

  return revision;
}
