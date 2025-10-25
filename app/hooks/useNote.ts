import { use, useCallback, useState } from "react";
import { withContainer } from "@/di";
import { deleteNote as deleteNoteService } from "@/core/application/note/deleteNote";
import { exportNoteAsMarkdown as exportNoteWithMarkdownService } from "@/core/application/note/exportNoteAsMarkdown";
import { getNote as getNoteService } from "@/core/application/note/getNote";
import { updateNote as updateNoteService } from "@/core/application/note/updateNote";
import type { Note } from "@/core/domain/note/entity";
import { createNoteId } from "@/core/domain/note/valueObject";
import { formatError } from "@/presenters/error";
import type { Callbacks } from "@/presenters/callback";

const getNote = withContainer(getNoteService);
const updateNote = withContainer(updateNoteService);
const deleteNote = withContainer(deleteNoteService);
const exportNoteAsMarkdown = withContainer(exportNoteWithMarkdownService);

export type SaveStatus = "saved" | "saving" | "unsaved";

export type UseNoteOptions = Callbacks;

export interface UseNoteResult {
  loading: boolean;
  deleting: boolean;
  exporting: boolean;
  editable: boolean;
  saveStatus: SaveStatus;
  save: (content: string) => Promise<void>;
  deleteNote: () => Promise<void>;
  exportNote: () => Promise<void>;
  toggleEditable: () => void;
}

/**
 * Hook for fetching and managing a single note
 */
export function useNote(
  noteId: string,
  { onSuccess, onError }: UseNoteOptions = {},
): UseNoteResult {
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editable, setEditable] = useState(false);

  // Update note content
  const save = useCallback(
    async (content: string) => {
      setSaveStatus("saving");

      try {
        await updateNote({
          id: createNoteId(noteId),
          content,
        });
        setSaveStatus("saved");
      } catch (error) {
        setSaveStatus("unsaved");
        onError?.(formatError(error));
      }
    },
    [noteId, onError],
  );

  // Delete note
  const _deleteNote = useCallback(async (): Promise<void> => {
    if (!noteId || deleting) return;
    setDeleting(true);
    try {
      await deleteNote({ id: createNoteId(noteId) });
      onSuccess?.("Note deleted");
    } catch (error) {
      onError?.(formatError(error));
    }
    setDeleting(false);
  }, [noteId, deleting, onSuccess, onError]);

  // Export note
  const exportNote = useCallback(async (): Promise<void> => {
    if (!noteId || exporting) return;

    setExporting(true);
    try {
      await exportNoteAsMarkdown({ id: createNoteId(noteId) });
      onSuccess?.("Note exported as Markdown");
    } catch (error) {
      onError?.(formatError(error));
    }
    setExporting(false);
  }, [noteId, exporting, onSuccess, onError]);

  const toggleEditable = useCallback(() => {
    setEditable((prev) => !prev);
  }, []);

  return {
    loading,
    deleting,
    exporting,
    saveStatus,
    editable,
    save,
    deleteNote: _deleteNote,
    exportNote,
    toggleEditable,
  };
}
