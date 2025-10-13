/**
 * Tag Domain - Query Service Port
 *
 * Defines the interface for complex read-only queries on Tags.
 * Handles queries that require JOINs with noteTagRelations table.
 */
import type { Tag, TagWithUsage } from "../entity";

export interface TagQueryService {
  /**
   * Find all tags with usage count (ordered by usage count descending)
   *
   * @returns List of tags with usage count, sorted by usage count descending
   *
   * @description
   * - JOINs with noteTagRelations table to calculate usage count
   * - Usage count represents the number of notes that have this tag
   * - Includes tags with zero usage count
   * - Sorted by usage count in descending order
   *
   * @throws {SystemError} If find operation fails
   */
  findAllWithUsage(): Promise<TagWithUsage[]>;

  /**
   * Find unused tags (tags with zero usage count)
   *
   * @returns List of tags with zero usage count
   *
   * @description
   * - LEFT JOINs with noteTagRelations table to find tags with zero usage
   * - Used for cleanup operations
   *
   * @throws {SystemError} If find operation fails
   */
  findUnused(): Promise<Tag[]>;
}
