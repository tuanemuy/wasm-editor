import { use, useCallback, useEffect, useRef, useState } from "react";
import { deleteNote as deleteNoteService } from "@/core/application/note/deleteNote";
import { exportNoteAsMarkdown as exportNoteWithMarkdownService } from "@/core/application/note/exportNoteAsMarkdown";
import { getNote as getNoteService } from "@/core/application/note/getNote";
import { updateNote as updateNoteService } from "@/core/application/note/updateNote";
import type { Note } from "@/core/domain/note/entity";
import type { StructuredContent } from "@/core/domain/note/valueObject";
import { createNoteId } from "@/core/domain/note/valueObject";
import { withContainer } from "@/di";
import { formatError } from "@/presenters/error";
import type { Notification } from "@/presenters/notification";
import { request } from "@/presenters/request";

const getNote = withContainer(getNoteService);
const updateNote = withContainer(updateNoteService);
const deleteNote = withContainer(deleteNoteService);
const exportNoteAsMarkdown = withContainer(exportNoteWithMarkdownService);

export type SaveStatus = "saved" | "saving" | "unsaved";

export type UseNoteOptions = Notification;

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
  { success, err }: UseNoteOptions = {},
): UseNoteResult {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editable, setEditable] = useState(false);

  // Ref to track the debounce timeout for save operations
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref to track save counter to prevent race conditions
  const saveCounterRef = useRef(0);

  // Update note content with debouncing to prevent race conditions
  const save = useCallback(
    async (content: StructuredContent, text: string) => {
      // Clear any pending save operation
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Increment save counter to track this save operation
      const currentSaveId = ++saveCounterRef.current;

      // Set status to "unsaved" immediately to indicate changes pending
      setSaveStatus("unsaved");

      // Debounce the save operation (300ms delay)
      saveTimeoutRef.current = setTimeout(async () => {
        // Only proceed if this is still the latest save request
        if (currentSaveId !== saveCounterRef.current) return;

        setSaveStatus("saving");

        await request(
          updateNote({
            id: createNoteId(noteId),
            content,
            text,
          }),
          {
            onSuccess: () => {
              // Only update if this is still the latest save
              if (currentSaveId === saveCounterRef.current) {
                setSaveStatus("saved");
              }
            },
            onError: (error) => {
              // Only update if this is still the latest save
              if (currentSaveId === saveCounterRef.current) {
                setSaveStatus("unsaved");
                err?.(formatError(error), error);
              }
            },
          },
        );
      }, 300);
    },
    [noteId, err],
  );

  // Delete note
  const _deleteNote = useCallback(async (): Promise<void> => {
    if (!noteId || deleting) return;
    setDeleting(true);

    await request(deleteNote({ id: createNoteId(noteId) }), {
      onSuccess: () => {
        success?.("Note deleted");
      },
      onError: (error) => {
        err?.(formatError(error), error);
      },
      onFinally: () => {
        setDeleting(false);
      },
    });
  }, [noteId, deleting, success, err]);

  // Export note
  const exportNote = useCallback(async (): Promise<void> => {
    if (!noteId || exporting) return;

    setExporting(true);

    await request(exportNoteAsMarkdown({ id: createNoteId(noteId) }), {
      onSuccess: () => {
        success?.("Note exported as Markdown");
      },
      onError: (error) => {
        err?.(formatError(error), error);
      },
      onFinally: () => {
        setExporting(false);
      },
    });
  }, [noteId, exporting, success, err]);

  const toggleEditable = useCallback(() => {
    setEditable((prev) => !prev);
  }, []);

  // Cleanup: clear pending timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
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
