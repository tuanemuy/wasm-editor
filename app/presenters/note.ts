/**
 * Utility functions for working with notes
 */

/**
 * Strip HTML tags from content
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/**
 * Extract title from note content
 * Takes the first line and removes markdown/HTML heading syntax
 */
export function extractTitle(content: string): string {
  // Strip HTML tags if present
  const plainContent = stripHtml(content);
  const firstLine = plainContent.split("\n")[0];
  const title = firstLine.replace(/^#+\s*/, "").trim();
  return title || "Untitled";
}

/**
 * Generate a preview of note content
 * Removes HTML/markdown syntax and truncates to max length
 */
export function generateNotePreview(content: string, maxLength = 150): string {
  // Strip HTML tags first
  const plainContent = stripHtml(content);
  const lines = plainContent.split("\n");
  const preview = lines
    .slice(0, 3) // Take first 3 lines
    .join(" ")
    .replace(/^#+\s*/, "") // Remove heading syntax
    .replace(/[*_~`]/g, "") // Remove markdown formatting
    .trim();

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
