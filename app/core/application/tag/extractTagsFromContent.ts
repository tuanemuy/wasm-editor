import { createTagName, type TagName } from "@/core/domain/tag/valueObject";

/**
 * Extract tags from markdown content
 * Pattern: #tagname
 * Valid characters: a-zA-Z0-9ぁ-んァ-ヶ一-龠々ー\-_
 */
export function extractTagsFromContent(content: string): TagName[] {
  const tagPattern = /#([a-zA-Z0-9ぁ-んァ-ヶ一-龠々ー\-_]+)/g;
  const matches = content.matchAll(tagPattern);
  const tagNames = new Set<string>();

  for (const match of matches) {
    const tagName = match[1];
    if (tagName) {
      tagNames.add(tagName);
    }
  }

  // Validate and convert to TagName
  const validatedTags: TagName[] = [];
  for (const name of tagNames) {
    try {
      validatedTags.push(createTagName(name));
    } catch (_error) {}
  }

  return validatedTags;
}
