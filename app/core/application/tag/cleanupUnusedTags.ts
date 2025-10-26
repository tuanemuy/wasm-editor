/**
 * Cleanup Unused Tags Use Case
 *
 * Deletes tags that are not associated with any notes.
 */
import type { TagId } from "@/core/domain/tag/valueObject";
import type { Context } from "../context";

export async function cleanupUnusedTags(context: Context): Promise<TagId[]> {
  // Delete unused tags using domain service
  // The service queries and deletes within the transaction to avoid race conditions
  const deletedTagIds = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await context.tagCleanupService.cleanupUnused(
        context.tagQueryService,
        repositories.tagRepository,
      );
    },
  );

  return deletedTagIds;
}
