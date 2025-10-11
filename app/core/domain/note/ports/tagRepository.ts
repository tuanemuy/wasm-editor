import type { Result } from "neverthrow";
import type { RepositoryError } from "@/core/error/adapter";
import type { Tag } from "../entity";
import type { TagName } from "../valueObject";

/**
 * Tag repository interface
 */
export interface TagRepository {
  /**
   * Find all tags with usage count
   */
  findAll(): Promise<Result<Tag[], RepositoryError>>;

  /**
   * Find a tag by name
   */
  findByName(name: TagName): Promise<Result<Tag | null, RepositoryError>>;
}
