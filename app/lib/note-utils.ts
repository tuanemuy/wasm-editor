/**
 * Utility functions for working with notes
 */

import type { StructuredContent } from "@/core/domain/note/valueObject";

/**
 * Extract text content from Tiptap JSON structure
 */
function extractTextFromJSON(content: StructuredContent): string {
  if (typeof content === "string") {
    return content;
  }

  if (!content || typeof content !== "object") {
    return "";
  }

  let text = "";

  // Handle text nodes
  if ("text" in content && typeof content.text === "string") {
    text += content.text;
  }

  // Recursively process content array
  if (Array.isArray(content.content)) {
    for (const child of content.content) {
      text += extractTextFromJSON(child as StructuredContent);
      // Add newline after block elements
      if (
        child &&
        typeof child === "object" &&
        "type" in child &&
        (child.type === "paragraph" ||
          child.type === "heading" ||
          child.type === "blockquote")
      ) {
        text += "\n";
      }
    }
  }

  return text;
}

/**
 * Extract title from note content
 * Takes the first line from the JSON structure
 */
export function extractTitle(content: StructuredContent): string {
  const plainContent = extractTextFromJSON(content);
  const firstLine = plainContent.split("\n")[0];
  const title = firstLine.trim();
  return title || "Untitled";
}

/**
 * Generate a preview of note content
 * Extracts text from JSON and truncates to max length
 */
export function generateNotePreview(
  content: StructuredContent,
  maxLength = 150,
): string {
  const plainContent = extractTextFromJSON(content);
  const lines = plainContent.split("\n").filter((line) => line.trim());
  const preview = lines.slice(0, 3).join(" ").trim();

  if (preview.length > maxLength) {
    return `${preview.slice(0, maxLength)}...`;
  }

  return preview || "Empty note";
}

/**
 * Format note content for display
 * Normalizes line breaks and removes excessive whitespace
 */
export function formatNoteContent(content: string): string {
  return content
    .replace(/\r\n/g, "\n") // Normalize line breaks
    .replace(/\n{3,}/g, "\n\n") // Limit consecutive line breaks
    .trim();
}
