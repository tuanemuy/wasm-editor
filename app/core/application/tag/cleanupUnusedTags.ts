/**
 * Cleanup Unused Tags Use Case
 *
 * Deletes tags that are not associated with any notes.
 */
import type { TagId } from "@/core/domain/tag/valueObject";
import type { Context } from "../context";

export async function cleanupUnusedTags(context: Context): Promise<TagId[]> {
  // Find unused tags
  const unusedTags = await context.tagQueryService.findUnused();

  if (unusedTags.length === 0) {
    return [];
  }

  const unusedTagIds = unusedTags.map((tag) => tag.id);

  // Delete unused tags
  await context.unitOfWorkProvider.run(async (repositories) => {
    await repositories.tagRepository.deleteMany(unusedTagIds);
  });

  return unusedTagIds;
}
