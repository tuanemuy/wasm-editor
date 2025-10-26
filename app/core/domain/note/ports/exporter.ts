/**
 * Note Domain - Exporter
 *
 * Defines the interface for exporting notes as Markdown files.
 */
import type { Note } from "../entity";

/**
 * Exported file information
 */
export type ExportedFile = {
  filename: string;
  content: string;
};

export interface Exporter {
  /**
   * Export a note as a Markdown file
   *
   * @param note - Note entity to export
   * @returns Exported file information
   *
   * @description
   * - Filename is generated from note content (extracted title) or created date
   * - File extension is .md
   *
   * @throws {SystemError} If export operation fails
   */
  exportAsMarkdown(note: Note): Promise<ExportedFile>;

  /**
   * Export multiple notes as a ZIP file
   *
   * @param notes - List of note entities to export
   * @returns ZIP file blob
   *
   * @description
   * - Each note is exported as a separate Markdown file
   * - Files are bundled into a single ZIP file
   *
   * @throws {SystemError} If export operation fails
   */
  exportMultipleAsMarkdown(notes: Note[]): Promise<Blob>;
}
