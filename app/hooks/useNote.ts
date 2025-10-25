import { use, useCallback, useRef, useState } from "react";
import { withContainer } from "@/di";
import { deleteNote as deleteNoteService } from "@/core/application/note/deleteNote";
import { exportNoteAsMarkdown as exportNoteWithMarkdownService } from "@/core/application/note/exportNoteAsMarkdown";
import { getNote as getNoteService } from "@/core/application/note/getNote";
import { updateNote as updateNoteService } from "@/core/application/note/updateNote";
import type { Note } from "@/core/domain/note/entity";
import type { StructuredContent } from "@/core/domain/note/valueObject";
import { createNoteId } from "@/core/domain/note/valueObject";
import { formatError } from "@/presenters/error";
import { request } from "@/presenters/request";
import type { Callbacks } from "@/presenters/callback";

const getNote = withContainer(getNoteService);
const updateNote = withContainer(updateNoteService);
const deleteNote = withContainer(deleteNoteService);
const exportNoteAsMarkdown = withContainer(exportNoteWithMarkdownService);

export type SaveStatus = "saved" | "saving" | "unsaved";

export type UseNoteOptions = Callbacks;

export interface UseNoteResult {
  deleting: boolean;
  exporting: boolean;
  editable: boolean;
  saveStatus: SaveStatus;
  save: (content: StructuredContent, text: string) => Promise<void>;
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
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editable, setEditable] = useState(false);

  // Ref to track the debounce timeout for save operations
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update note content with debouncing to prevent race conditions
  const save = useCallback(
    async (content: StructuredContent, text: string) => {
      // Clear any pending save operation
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      setSaveStatus("saving");

      // Debounce the save operation (300ms delay)
      saveTimeoutRef.current = setTimeout(async () => {
        await request(
          updateNote({
            id: createNoteId(noteId),
            content,
            text,
          }),
          {
            onSuccess: () => {
              setSaveStatus("saved");
            },
            onError: (error) => {
              setSaveStatus("unsaved");
              onError?.(formatError(error));
            },
          },
        );
      }, 300);
    },
    [noteId, onError],
  );

  // Delete note
  const _deleteNote = useCallback(async (): Promise<void> => {
    if (!noteId || deleting) return;
    setDeleting(true);

    await request(deleteNote({ id: createNoteId(noteId) }), {
      onSuccess: () => {
        onSuccess?.("Note deleted");
      },
      onError: (error) => {
        onError?.(formatError(error));
      },
      onFinally: () => {
        setDeleting(false);
      },
    });
  }, [noteId, deleting, onSuccess, onError]);

  // Export note
  const exportNote = useCallback(async (): Promise<void> => {
    if (!noteId || exporting) return;

    setExporting(true);

    await request(exportNoteAsMarkdown({ id: createNoteId(noteId) }), {
      onSuccess: () => {
        onSuccess?.("Note exported as Markdown");
      },
      onError: (error) => {
        onError?.(formatError(error));
      },
      onFinally: () => {
        setExporting(false);
      },
    });
  }, [noteId, exporting, onSuccess, onError]);

  const toggleEditable = useCallback(() => {
    setEditable((prev) => !prev);
  }, []);

  return {
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
