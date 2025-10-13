import type { Note } from "../entity";

export interface ExportPort {
  /**
   * Export a note as Markdown file
   * @throws {SystemError} Export error
   */
  exportAsMarkdown(note: Note, fileName: string): Promise<void>;

  /**
   * Export multiple notes as Markdown files
   * @throws {SystemError} Export error
   */
  exportMultipleAsMarkdown(notes: Note[], directoryName: string): Promise<void>;
}
