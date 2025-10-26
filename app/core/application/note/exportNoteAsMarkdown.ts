/**
 * Export Note as Markdown Use Case
 *
 * Exports a single note as a Markdown file.
 */

import type { ExportedFile } from "@/core/domain/note/ports/exporter";
import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";

export type ExportNoteAsMarkdownInput = {
  id: NoteId;
};

export async function exportNoteAsMarkdown(
  context: Context,
  input: ExportNoteAsMarkdownInput,
): Promise<ExportedFile> {
  // Find note
  const note = await context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.noteRepository.findById(input.id);
  });

  // Export as markdown
  return await context.exporter.exportAsMarkdown(note);
}
