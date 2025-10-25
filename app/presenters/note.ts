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
 * Extract the first heading from note content
 * Returns the text content of the first heading node found
 */
function extractFirstHeading(content: StructuredContent): string | null {
  if (typeof content !== "object" || content === null) {
    return null;
  }

  // Check if this node is a heading
  if (content.type === "heading" && Array.isArray(content.content)) {
    const headingText = extractTextFromJSON(content).trim();
    if (headingText) {
      return headingText;
    }
  }

  // Recursively search in children
  if (Array.isArray(content.content)) {
    for (const child of content.content) {
      if (typeof child === "object" && child !== null) {
        const heading = extractFirstHeading(child as StructuredContent);
        if (heading) {
          return heading;
        }
      }
    }
  }

  return null;
}

/**
 * Extract title from note content
 * 1. Uses the first heading if available
 * 2. Otherwise, extracts the first 50 characters from the beginning of the text
 */
export function extractTitle(content: StructuredContent): string {
  // First, try to find a heading
  const heading = extractFirstHeading(content);
  if (heading) {
    return heading;
  }

  // If no heading, extract the first 50 characters
  const plainContent = extractTextFromJSON(content);
  const text = plainContent.trim();

  if (!text) {
    return "Untitled";
  }

  // Take the first 50 characters
  const maxLength = 50;
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
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
