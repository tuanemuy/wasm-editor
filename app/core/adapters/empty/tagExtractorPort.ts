/**
 * Empty Tag Extractor Port
 *
 * Stub implementation for testing purposes.
 * Use vi.spyOn to mock methods in tests.
 */
import type { TagExtractorPort } from "@/core/domain/tag/ports/tagExtractorPort";

export class EmptyTagExtractorPort implements TagExtractorPort {
  async extractTags(_content: string): Promise<string[]> {
    throw new Error("Not implemented");
  }
}
