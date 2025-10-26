/**
 * Empty Tag Extractor
 *
 * Stub implementation for testing purposes.
 * Use vi.spyOn to mock methods in tests.
 */
import type { TagExtractor } from "@/core/domain/tag/ports/tagExtractor";

export class EmptyTagExtractor implements TagExtractor {
  async extractTags(_content: string): Promise<string[]> {
    throw new Error("Not implemented");
  }
}
