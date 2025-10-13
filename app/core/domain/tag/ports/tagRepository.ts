import type { Tag } from "../entity";
import type { TagId, TagName } from "../valueObject";

export interface TagRepository {
  /**
   * Create a tag
   * @throws {SystemError} DB save error
   */
  create(tag: Tag): Promise<Tag>;

  /**
   * Update a tag
   * @throws {SystemError} DB save error
   */
  update(tag: Tag): Promise<Tag>;

  /**
   * Delete a tag
   * @throws {SystemError} DB delete error
   */
  delete(id: TagId): Promise<void>;

  /**
   * Find a tag by ID
   * @throws {SystemError} DB fetch error
   */
  findById(id: TagId): Promise<Tag | null>;

  /**
   * Find a tag by name
   * @throws {SystemError} DB fetch error
   */
  findByName(name: TagName): Promise<Tag | null>;

  /**
   * Find all tags (sorted by usage count desc)
   * @throws {SystemError} DB fetch error
   */
  findAll(): Promise<Tag[]>;

  /**
   * Find tags by names
   * @throws {SystemError} DB fetch error
   */
  findByNames(names: TagName[]): Promise<Tag[]>;

  /**
   * Increment usage count
   * @throws {SystemError} DB update error
   */
  incrementUsageCount(id: TagId): Promise<void>;

  /**
   * Decrement usage count
   * @throws {SystemError} DB update error
   */
  decrementUsageCount(id: TagId): Promise<void>;

  /**
   * Delete unused tags (usageCount = 0)
   * @throws {SystemError} DB delete error
   */
  deleteUnusedTags(): Promise<void>;
}
