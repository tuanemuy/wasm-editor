import { err, ok, type Result } from "neverthrow";
import type { NoteId } from "@/core/domain/note/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type ExportNoteAsMarkdownInput = {
  noteId: NoteId;
  suggestedName?: string;
};

export async function exportNoteAsMarkdown(
  context: Context,
  input: ExportNoteAsMarkdownInput,
): Promise<Result<string, ApplicationError>> {
  // Get note
  const noteResult = await context.noteRepository.findById(input.noteId);

  if (noteResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to export note",
        noteResult.error,
      ),
    );
  }

  const note = noteResult.value;
  if (note === null) {
    return err(
      new ApplicationError(ApplicationErrorCode.NOT_FOUND, "Note not found"),
    );
  }

  // Get assets
  const assetsResult = await context.assetRepository.findByNoteId(input.noteId);

  if (assetsResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to get assets",
        assetsResult.error,
      ),
    );
  }

  // Export to markdown
  const markdownResult = await context.markdownExporter.export(
    note,
    assetsResult.value,
  );

  if (markdownResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to export to markdown",
        markdownResult.error,
      ),
    );
  }

  // Save file with dialog
  const fileName = input.suggestedName ?? `note-${note.id}.md`;
  const file = new File([markdownResult.value], fileName, {
    type: "text/markdown",
  });

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

  return ok(saveResult.value);
}
