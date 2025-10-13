import { err, ok, type Result } from "neverthrow";
import type { NoteId } from "@/core/domain/note/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type ExportNotesAsMarkdownInput = {
  noteIds: NoteId[];
};

export async function exportNotesAsMarkdown(
  context: Context,
  input: ExportNotesAsMarkdownInput,
): Promise<Result<string[], ApplicationError>> {
  // Get all notes
  const notes = [];
  for (const noteId of input.noteIds) {
    const noteResult = await context.noteRepository.findById(noteId);

    if (noteResult.isErr()) {
      return err(
        new ApplicationError(
          ApplicationErrorCode.INTERNAL_SERVER_ERROR,
          "Failed to get notes",
          noteResult.error,
        ),
      );
    }

    if (noteResult.value === null) {
      return err(
        new ApplicationError(
          ApplicationErrorCode.NOT_FOUND,
          `Note not found: ${noteId}`,
        ),
      );
    }

    notes.push(noteResult.value);
  }

  // Get all assets
  const assetsByNoteId = new Map();
  for (const noteId of input.noteIds) {
    const assetsResult = await context.assetRepository.findByNoteId(noteId);

    if (assetsResult.isErr()) {
      return err(
        new ApplicationError(
          ApplicationErrorCode.INTERNAL_SERVER_ERROR,
          "Failed to get assets",
          assetsResult.error,
        ),
      );
    }

    assetsByNoteId.set(noteId, assetsResult.value);
  }

  // Export to markdown
  const markdownResults = await context.markdownExporter.exportMultiple(
    notes,
    assetsByNoteId,
  );

  if (markdownResults.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to export to markdown",
        markdownResults.error,
      ),
    );
  }

  // Save files
  const savedPaths: string[] = [];
  for (let i = 0; i < notes.length; i++) {
    const note = notes[i];
    const markdown = markdownResults.value[i];
    const fileName = `note-${note.id}.md`;
    const file = new File([markdown], fileName, { type: "text/markdown" });

    const saveResult = await context.exportStorageManager.saveWithDialog(
      file,
      fileName,
    );

    if (saveResult.isErr()) {
      return err(
        new ApplicationError(
          ApplicationErrorCode.INTERNAL_SERVER_ERROR,
          "Failed to save file",
          saveResult.error,
        ),
      );
    }

    savedPaths.push(saveResult.value);
  }

  return ok(savedPaths);
}
