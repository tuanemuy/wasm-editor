/**
 * Tag Domain - Repository Port
 *
 * Defines the interface for Tag aggregate persistence.
 * Responsible for basic CRUD operations on Tag entities.
 *
 * Note: TagRepository only handles Tag aggregate persistence.
 * Tag-Note relationships are managed by NoteRepository.
 * Usage count aggregation is handled by TagQueryService.
 */
import type { Tag } from "../entity";
import type { TagId, TagName } from "../valueObject";

export interface TagRepository {
  /**
   * Save a tag (create or update)
   *
   * @param tag - Tag entity to save
   * @throws {SystemError} If save operation fails
   */
  save(tag: Tag): Promise<void>;

  /**
   * Find a tag by name
   *
   * @param name - Tag name
   * @returns Tag entity or null if not found
   * @throws {SystemError} If find operation fails
   */
  findByName(name: TagName): Promise<Tag | null>;

  /**
   * Find a tag by ID
   *
   * @param id - Tag ID
   * @returns Tag entity
   * @throws {NotFoundError} If tag is not found
   * @throws {SystemError} If find operation fails
   */
  findById(id: TagId): Promise<Tag>;

  /**
   * Find multiple tags by IDs
   *
   * @param ids - List of tag IDs
   * @returns List of tag entities
   * @throws {SystemError} If find operation fails
   */
  findByIds(ids: TagId[]): Promise<Tag[]>;

  /**
   * Find all tags
   *
   * @returns List of all tag entities
   * @throws {SystemError} If find operation fails
   */
  findAll(): Promise<Tag[]>;

  /**
   * Delete a tag
   *
   * @param id - Tag ID
   * @throws {SystemError} If delete operation fails
   */
  delete(id: TagId): Promise<void>;

  /**
   * Delete multiple tags
   *
   * @param ids - List of tag IDs
   * @throws {SystemError} If delete operation fails
   */
  deleteMany(ids: TagId[]): Promise<void>;

  /**
   * Check if a tag exists
   *
   * @param id - Tag ID
   * @returns True if tag exists, false otherwise
   * @throws {SystemError} If check operation fails
   */
  exists(id: TagId): Promise<boolean>;
}
