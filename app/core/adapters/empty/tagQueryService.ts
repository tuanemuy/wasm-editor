/**
 * Empty Tag Query Service
 *
 * Stub implementation for testing purposes.
 * Use vi.spyOn to mock methods in tests.
 */
import type { Tag, TagWithUsage } from "@/core/domain/tag/entity";
import type { TagQueryService } from "@/core/domain/tag/ports/tagQueryService";

export class EmptyTagQueryService implements TagQueryService {
  async findAllWithUsage(): Promise<TagWithUsage[]> {
    throw new Error("Not implemented");
  }

  async findUnused(): Promise<Tag[]> {
    throw new Error("Not implemented");
  }
}
