/**
 * Utility functions for working with notes
 */

import type { StructuredContent } from "@/core/domain/note/valueObject";

// Block elements that should have newlines after them
const BLOCK_ELEMENTS = new Set(["paragraph", "heading", "blockquote"]);

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
      // Type guard: ensure child is an object before processing
      if (typeof child === "object" && child !== null) {
        text += extractTextFromJSON(child as StructuredContent);
        // Add newline after block elements
        if (
          "type" in child &&
          typeof child.type === "string" &&
          BLOCK_ELEMENTS.has(child.type)
        ) {
          text += "\n";
        }
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
