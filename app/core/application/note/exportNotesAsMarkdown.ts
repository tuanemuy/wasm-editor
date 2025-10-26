/**
 * Export Notes as Markdown Use Case
 *
 * Exports multiple notes as Markdown files bundled in a ZIP archive.
 */
import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";

export type ExportNotesAsMarkdownInput = {
  ids: NoteId[];
};

export async function exportNotesAsMarkdown(
  context: Context,
  input: ExportNotesAsMarkdownInput,
): Promise<Blob> {
  // Find notes
  const notes = await context.unitOfWorkProvider.run(async (repositories) => {
    // Fetch all notes in parallel
    return await Promise.all(
      input.ids.map((id) => repositories.noteRepository.findById(id)),
    );
  });

  // Export as ZIP
  return await context.exporter.exportMultipleAsMarkdown(notes);
}
