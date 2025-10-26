/**
 * Utility functions for working with notes
 */

import type { Content } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import type { StructuredContent } from "@/core/domain/note/valueObject";
import { defaultNotification } from "@/presenters/notification";

/**
 * Type adapter to convert between domain StructuredContent and Tiptap's Content type.
 * StructuredContent is a domain-level abstraction that's structurally compatible with
 * Tiptap's JSON format, but TypeScript requires explicit conversion.
 * @param content - The domain StructuredContent to convert
 * @returns Tiptap Content type or empty document if validation fails
 */
export function toTiptapContent(content: StructuredContent): Content {
  try {
    // Runtime validation: ensure content has the expected structure
    if (!content || typeof content !== "object") {
      throw new Error("Invalid content structure: must be an object");
    }
    if (!("type" in content) || typeof content.type !== "string") {
      throw new Error(
        "Invalid content structure: missing or invalid 'type' field",
      );
    }
    if ("content" in content && !Array.isArray(content.content)) {
      throw new Error("Invalid content structure: 'content' must be an array");
    }
    return content as unknown as Content;
  } catch (error) {
    defaultNotification.err(
      `Failed to load content: ${error instanceof Error ? error.message : String(error)}`,
    );
    // Return empty document as fallback
    return { type: "doc", content: [] };
  }
}

/**
 * Type adapter to convert from Tiptap's Content to domain StructuredContent.
 * @param content - The Tiptap Content to convert
 * @returns Domain StructuredContent type or empty document if validation fails
 */
export function fromTiptapContent(content: Content): StructuredContent {
  try {
    // Runtime validation: ensure content has the expected structure
    const json = content as Record<string, unknown>;
    if (!json || typeof json !== "object") {
      throw new Error("Invalid Tiptap content structure: must be an object");
    }
    if (!("type" in json) || typeof json.type !== "string") {
      throw new Error(
        "Invalid Tiptap content structure: missing or invalid 'type' field",
      );
    }
    if ("content" in json && !Array.isArray(json.content)) {
      throw new Error(
        "Invalid Tiptap content structure: 'content' must be an array",
      );
    }
    return json as StructuredContent;
  } catch (error) {
    defaultNotification.err(
      `Failed to convert content: ${error instanceof Error ? error.message : String(error)}`,
    );
    // Return empty document as fallback
    return { type: "doc", content: [] };
  }
}

// Block elements that should have newlines after them
const BLOCK_ELEMENTS = new Set(["paragraph", "heading", "blockquote"]);

// Maximum length for title extraction from plain text
const TITLE_MAX_LENGTH = 50;

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
      if (typeof child === "object" && child !== null && "type" in child) {
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
 *    - Adds "..." if text exceeds 50 characters
 * 3. Returns "Untitled" if no content exists
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

  // Take the first TITLE_MAX_LENGTH characters
  // Use Array.from to handle Unicode code points correctly (e.g., emoji)
  const codePoints = Array.from(text);
  if (codePoints.length <= TITLE_MAX_LENGTH) {
    return text;
  }

  return `${codePoints.slice(0, TITLE_MAX_LENGTH).join("")}...`;
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

  // Use Array.from to handle Unicode code points correctly (e.g., emoji)
  const codePoints = Array.from(preview);
  if (codePoints.length > maxLength) {
    return `${codePoints.slice(0, maxLength).join("")}...`;
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

/**
 * Generate HTML from structured content
 * Uses the same extensions as the TiptapEditor for consistency
 */
export function generateNoteHTML(content: StructuredContent): string {
  // Type adapter to convert from domain StructuredContent to Tiptap's expected format
  // This is safe because StructuredContent is structurally compatible with Tiptap's JSON format
  return generateHTML(content as Parameters<typeof generateHTML>[0], [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
    }),
    Link.configure({
      HTMLAttributes: {
        class: "text-primary underline",
      },
    }),
  ]);
}

/**
 * Highlight search query in HTML content
 * Safely highlights text nodes while preserving HTML structure
 * @param html - The HTML string to process
 * @param query - The search query to highlight
 * @returns HTML string with highlighted matches
 */
export function highlightHTMLContent(html: string, query: string): string {
  if (!query.trim()) {
    return html;
  }

  try {
    // Escape special regex characters
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");

    // Use DOMParser to safely parse and manipulate HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    // Recursive function to highlight text nodes
    function highlightTextNodes(node: Node): void {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        if (regex.test(text)) {
          // Reset regex index
          regex.lastIndex = 0;

          // Create a temporary container for the highlighted content
          const span = document.createElement("span");
          const parts = text.split(regex);

          for (const part of parts) {
            if (!part) continue;

            regex.lastIndex = 0;
            const isMatch = regex.test(part);
            regex.lastIndex = 0;

            if (isMatch) {
              const mark = document.createElement("mark");
              mark.className =
                "bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded";
              mark.textContent = part;
              span.appendChild(mark);
            } else {
              span.appendChild(document.createTextNode(part));
            }
          }

          // Replace the text node with the highlighted content
          node.parentNode?.replaceChild(span, node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Skip script and style elements
        const element = node as Element;
        if (element.tagName !== "SCRIPT" && element.tagName !== "STYLE") {
          // Process child nodes (use array to avoid live NodeList issues)
          Array.from(node.childNodes).forEach(highlightTextNodes);
        }
      }
    }

    // Start highlighting from the body element
    highlightTextNodes(doc.body);

    // Return the highlighted HTML
    return doc.body.innerHTML;
  } catch {
    // If processing fails, return the original HTML
    return html;
  }
}
