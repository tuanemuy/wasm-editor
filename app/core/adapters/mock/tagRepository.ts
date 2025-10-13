import { err, ok, type Result } from "neverthrow";
import type { Tag } from "@/core/domain/note/entity";
import type { TagRepository } from "@/core/domain/note/ports/tagRepository";
import type { TagName } from "@/core/domain/note/valueObject";
import { RepositoryError } from "@/core/error/adapter";

/**
 * Mock tag repository for testing
 */
export class MockTagRepository implements TagRepository {
  private tags: Map<TagName, Tag> = new Map();
  private shouldFailFindAll = false;
  private shouldFailFindByName = false;

  constructor(initialTags?: Tag[]) {
    if (initialTags) {
      for (const tag of initialTags) {
        this.tags.set(tag.name, tag);
      }
    }
  }

  /**
   * Set whether findAll should fail
   */
  setShouldFailFindAll(shouldFail: boolean): void {
    this.shouldFailFindAll = shouldFail;
  }

  /**
   * Set whether findByName should fail
   */
  setShouldFailFindByName(shouldFail: boolean): void {
    this.shouldFailFindByName = shouldFail;
  }

  /**
   * Find all tags with usage count
   */
  async findAll(): Promise<Result<Tag[], RepositoryError>> {
    if (this.shouldFailFindAll) {
      return err(new RepositoryError("Mock repository error"));
    }

    const tags = Array.from(this.tags.values());
    return ok(tags);
  }

  /**
   * Find a tag by name
   */
  async findByName(
    name: TagName,
  ): Promise<Result<Tag | null, RepositoryError>> {
    if (this.shouldFailFindByName) {
      return err(new RepositoryError("Mock repository error"));
    }

    const tag = this.tags.get(name);
    return ok(tag ?? null);
  }

  /**
   * Set tags (for testing)
   */
  setTags(tags: Tag[]): void {
    this.tags.clear();
    for (const tag of tags) {
      this.tags.set(tag.name, tag);
    }
  }

  /**
   * Reset the repository state
   */
  reset(): void {
    this.tags.clear();
    this.shouldFailFindAll = false;
    this.shouldFailFindByName = false;
  }
}
