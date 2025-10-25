/**
 * Empty Tag Repository
 *
 * Stub implementation for testing purposes.
 * Use vi.spyOn to mock methods in tests.
 */
import type { Tag } from "@/core/domain/tag/entity";
import type { TagRepository } from "@/core/domain/tag/ports/tagRepository";
import type { TagId, TagName } from "@/core/domain/tag/valueObject";

export class EmptyTagRepository implements TagRepository {
  async save(_tag: Tag): Promise<void> {
    // Stub implementation
  }

  async findByName(_name: TagName): Promise<Tag | null> {
    throw new Error("Not implemented");
  }

  async findById(_id: TagId): Promise<Tag> {
    throw new Error("Not implemented");
  }

  async findByIds(_ids: TagId[]): Promise<Tag[]> {
    throw new Error("Not implemented");
  }

  async findAll(): Promise<Tag[]> {
    throw new Error("Not implemented");
  }

  async delete(_id: TagId): Promise<void> {
    // Stub implementation
  }

  async deleteMany(_ids: TagId[]): Promise<void> {
    // Stub implementation
  }

  async exists(_id: TagId): Promise<boolean> {
    throw new Error("Not implemented");
  }
}
