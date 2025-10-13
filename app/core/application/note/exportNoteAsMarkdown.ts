import type { NoteId } from "@/core/domain/note/valueObject";
import type { Context } from "../context";
import { NotFoundError, NotFoundErrorCode } from "../error";

export type ExportNoteAsMarkdownInput = {
  id: NoteId;
  fileName?: string;
};

export async function exportNoteAsMarkdown(
  context: Context,
  input: ExportNoteAsMarkdownInput,
): Promise<void> {
  // Get note
  const note = await context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.noteRepository.findById(input.id);
  });

  if (!note) {
    throw new NotFoundError(NotFoundErrorCode.NotFound, "Note not found");
  }

  // Generate file name if not provided
  const fileName =
    input.fileName ||
    `note-${note.createdAt.toISOString().replace(/[:.]/g, "-")}.md`;

  // Export
  await context.exportPort.exportAsMarkdown(note, fileName);
}
