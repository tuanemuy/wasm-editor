/**
 * Tag Domain - Domain Service
 *
 * Provides domain logic for tag operations that don't naturally fit
 * within a single entity or repository.
 *
 * Note: Domain services do NOT manage transactions.
 * Transaction management is the responsibility of Application Services.
 */
import type { Tag } from "./entity";
import { createTag } from "./entity";
import type { TagExtractorPort } from "./ports/tagExtractorPort";
import type { TagQueryService } from "./ports/tagQueryService";
import type { TagRepository } from "./ports/tagRepository";
import type { TagId } from "./valueObject";
import { createTagName } from "./valueObject";

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
   * @returns Array of deleted tag IDs
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
   * - Returns deleted tag IDs to avoid duplicate queries by caller
   *
   * @throws {SystemError} If cleanup operation fails
   */
  async cleanupUnused(
    queryService: TagQueryService,
    repository: TagRepository,
  ): Promise<TagId[]> {
    const unusedTags = await queryService.findUnused();

    if (unusedTags.length === 0) {
      return [];
    }

    const unusedTagIds = unusedTags.map((tag) => tag.id);
    await repository.deleteMany(unusedTagIds);
    return unusedTagIds;
  }
}

/**
 * Tag Sync Service
 *
 * Handles extraction of tags from text and synchronization with repository.
 * Encapsulates the business logic for creating tags from text content.
 */
export class TagSyncService {
  /**
   * Extract tags from text and get or create them in repository
   *
   * @param tagExtractor - Port for extracting tag names from text
   * @param repository - Tag repository
   * @param text - Text to extract tags from
   * @returns Array of tags (existing or newly created)
   *
   * @description
   * This service:
   * - Extracts tag names from text using the provided extractor
   * - Validates tag names through domain value objects (createTagName)
   * - Finds existing tags or creates new ones
   * - Handles errors gracefully (invalid tags are skipped)
   * - Must be called within a transaction context
   *
   * Design rationale:
   * - Encapsulates tag extraction and synchronization logic
   * - Prevents code duplication across application services (updateNote, etc.)
   * - Does NOT create its own transaction (allows use within existing transactions)
   * - Delegates validation to domain value objects (follows DDD principles)
   * - Gracefully handles extraction and validation errors
   * - Returns empty array on extraction failure (non-blocking)
   */
  async extractAndSync(
    tagExtractor: TagExtractorPort,
    repository: TagRepository,
    text: string,
  ): Promise<Tag[]> {
    // Extract tag names from text
    let tagNames: string[] = [];
    try {
      tagNames = await tagExtractor.extractTags(text);
    } catch (_error) {
      // Silent failure - return empty tags
      // Logging strategy is a future consideration
      return [];
    }

    // Deduplicate tag names to prevent race conditions
    // when multiple identical tags are extracted from text
    const uniqueTagNames = [...new Set(tagNames)];

    // Get or create tags
    // Skip invalid tag names instead of failing the entire operation
    const tags = (
      await Promise.all(
        uniqueTagNames.map(async (tagName) => {
          try {
            // Validate tag name
            const validatedName = createTagName(tagName);

            // Check if tag exists
            const existingTag = await repository.findByName(validatedName);

            if (existingTag) {
              return existingTag;
            }

            // Create new tag
            const newTag = createTag({ name: tagName });
            await repository.save(newTag);
            return newTag;
          } catch (_error) {
            // Skip invalid tag names
            // Logging strategy is a future consideration
            return null;
          }
        }),
      )
    ).filter((tag): tag is Tag => tag !== null);

    return tags;
  }
}
