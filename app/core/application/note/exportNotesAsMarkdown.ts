import type { Note } from "@/core/domain/note/entity";
import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";

export type ExportNotesAsMarkdownInput = {
  ids: NoteId[];
  directoryName?: string;
};

export async function exportNotesAsMarkdown(
  context: Context,
  input: ExportNotesAsMarkdownInput,
): Promise<void> {
  // Get all notes
  const notes: Note[] = [];
  await context.unitOfWorkProvider.run(async (repositories) => {
    for (const id of input.ids) {
      const note = await repositories.noteRepository.findById(id);
      if (note) {
        notes.push(note);
      }
    }
  });

  // Generate directory name if not provided
  const directoryName =
    input.directoryName ||
    `notes-export-${new Date().toISOString().replace(/[:.]/g, "-")}`;

  // Export
  await context.exportPort.exportMultipleAsMarkdown(notes, directoryName);
}
