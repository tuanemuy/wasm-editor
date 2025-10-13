import * as z from "zod";

/**
 * Export format
 */
export const exportFormatSchema = z.enum(["markdown"]);
export type ExportFormat = z.infer<typeof exportFormatSchema>;

/**
 * Export file name
 */
export const exportFileNameSchema = z.string().min(1).max(255);
export type ExportFileName = z.infer<typeof exportFileNameSchema>;

/**
 * Generate export file name from note content
 * 1. Extract the first heading (# Title) from the content
 * 2. If no heading is found, use the created date
 * 3. Remove invalid characters for file names
 */
export function generateExportFileName(
  content: string,
  createdAt: Date,
): ExportFileName {
  // Extract first heading
  const headingMatch = content.match(/^#\s+(.+)$/m);
  let fileName: string;

  if (headingMatch?.[1]) {
    fileName = headingMatch[1].trim();
  } else {
    // Use created date if no heading
    const year = createdAt.getFullYear();
    const month = String(createdAt.getMonth() + 1).padStart(2, "0");
    const day = String(createdAt.getDate()).padStart(2, "0");
    const hours = String(createdAt.getHours()).padStart(2, "0");
    const minutes = String(createdAt.getMinutes()).padStart(2, "0");
    const seconds = String(createdAt.getSeconds()).padStart(2, "0");
    fileName = `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }

  // Remove invalid characters for file names
  // Invalid characters: \ / : * ? " < > |
  fileName = fileName.replace(/[\\/:"*?<>|]/g, "");
  // Replace spaces with underscores
  fileName = fileName.replace(/\s+/g, "_");

  return fileName as ExportFileName;
}
