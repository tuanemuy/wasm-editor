/**
 * Tag Domain - Tag Extractor Port
 *
 * Defines the interface for extracting tags from note content.
 * This port abstracts the implementation details of tag parsing,
 * allowing for different implementations (e.g., simple regex, markdown parser).
 */
export interface TagExtractorPort {
  /**
   * Extract tags from note content
   *
   * @param content - Note content (Markdown)
   * @returns List of extracted tag names (deduplicated, case-sensitive)
   *
   * @description
   * Business Rules:
   * - Tags are written in the format: #tagname
   * - Tag names must only contain: alphanumeric, hiragana, katakana, kanji, hyphen, underscore
   * - Tag names must not contain spaces
   * - Duplicate tags are removed (case-sensitive)
   * - Case is preserved
   *
   * Pattern: #([a-zA-Z0-9ぁ-んァ-ヶー一-龯\-_]+)
   *
   * @throws {SystemError} If extraction operation fails
   */
  extractTags(content: string): Promise<string[]>;
}
