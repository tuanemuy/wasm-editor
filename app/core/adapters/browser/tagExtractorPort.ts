/**
 * Browser Tag Extractor Port Adapter
 *
 * Implements TagExtractorPort using regex pattern matching.
 * Extracts hashtags from note content.
 */
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { TagExtractorPort } from "@/core/domain/tag/ports/tagExtractorPort";

export class BrowserTagExtractorPort implements TagExtractorPort {
  /**
   * Tag pattern: #([a-zA-Z0-9ぁ-んァ-ヶー一-龯\-_]+)
   *
   * Matches:
   * - Starts with #
   * - Followed by: alphanumeric, hiragana, katakana, kanji, hyphen, underscore
   * - No spaces allowed
   */
  private readonly tagPattern = /#([a-zA-Z0-9ぁ-んァ-ヶー一-龯\-_]+)/g;

  async extractTags(content: string): Promise<string[]> {
    try {
      const tags = new Set<string>();

      // Reset regex state
      this.tagPattern.lastIndex = 0;

      const matches = content.matchAll(this.tagPattern);
      for (const match of matches) {
        const tagName = match[1];
        tags.add(tagName);
      }

      return Array.from(tags);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.TagExtractionError,
        "Failed to extract tags from content",
        error,
      );
    }
  }
}
