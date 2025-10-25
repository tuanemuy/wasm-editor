/**
 * Get Tags Use Case
 *
 * Retrieves all tags with usage count, sorted by usage count descending.
 */
import type { TagWithUsage } from "@/core/domain/tag/entity";
import type { Context } from "../context";

export async function getTags(context: Context): Promise<TagWithUsage[]> {
  return await context.tagQueryService.findAllWithUsage();
}
