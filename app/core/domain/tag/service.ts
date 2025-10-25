/**
 * Tag Domain - Domain Service
 *
 * Provides domain logic for tag operations that don't naturally fit
 * within a single entity or repository.
 *
 * Note: Domain services do NOT manage transactions.
 * Transaction management is the responsibility of Application Services.
 */
import type { TagQueryService } from "./ports/tagQueryService";
import type { TagRepository } from "./ports/tagRepository";

/**
 * Tag Cleanup Service
 *
 * Handles cleanup of unused tags within an existing transaction context.
 * This service encapsulates the business logic for identifying and removing
 * tags that are no longer associated with any notes.
 */
export class TagCleanupService {
  /**
   * Clean up unused tags
   *
   * @param queryService - Tag query service for finding unused tags
   * @param repository - Tag repository for deleting tags
   *
   * @description
   * Finds all tags that are not associated with any notes and deletes them.
   * This operation is performed within the caller's transaction context.
   *
   * Design rationale:
   * - Encapsulates the cleanup logic in a reusable domain service
   * - Does NOT create its own transaction (allows use within existing transactions)
   * - Prevents code duplication across application services
   * - Maintains single responsibility principle
   *
   * @throws {SystemError} If cleanup operation fails
   */
  async cleanupUnused(
    queryService: TagQueryService,
    repository: TagRepository,
  ): Promise<void> {
    const unusedTags = await queryService.findUnused();

    if (unusedTags.length > 0) {
      const unusedTagIds = unusedTags.map((tag) => tag.id);
      await repository.deleteMany(unusedTagIds);
    }
  }
}
