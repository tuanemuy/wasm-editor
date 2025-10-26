import { useCallback, useEffect, useRef, useState } from "react";
import { cleanupUnusedTags } from "@/core/application/tag/cleanupUnusedTags";
import { deleteNote as deleteNoteService } from "@/core/application/note/deleteNote";
import { exportNoteAsMarkdown as exportNoteWithMarkdownService } from "@/core/application/note/exportNoteAsMarkdown";
import { getNote as getNoteService } from "@/core/application/note/getNote";
import { updateNote as updateNoteService } from "@/core/application/note/updateNote";
import type { StructuredContent } from "@/core/domain/note/valueObject";
import { createNoteId } from "@/core/domain/note/valueObject";
import { withContainer } from "@/di";
import { formatError } from "@/presenters/error";
import type { Notification } from "@/presenters/notification";
import { request } from "@/presenters/request";

const _getNote = withContainer(getNoteService);
const updateNote = withContainer(updateNoteService);
const deleteNote = withContainer(deleteNoteService);
const exportNoteAsMarkdown = withContainer(exportNoteWithMarkdownService);
const cleanupUnusedTags = withContainer(cleanupUnusedTags);

/**
 * Tag Cleanup Scheduler
 *
 * Manages delayed and debounced execution of tag cleanup operations in the presentation layer.
 * Prevents performance issues from excessive cleanup calls.
 */
class TagCleanupScheduler {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  scheduleCleanup(cleanupFn: () => Promise<void>, delayMs: number = 1000): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      cleanupFn().catch((error) => {
        console.error("Background tag cleanup failed:", error);
      });
      this.timeoutId = null;
    }, delayMs);
  }

  cancel(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

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
  // Tag cleanup scheduler for managing cleanup operations
  // Initialize directly to prevent memory leaks from recreating instances
  const cleanupSchedulerRef = useRef(new TagCleanupScheduler());

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

      // Debounce the save operation (1000ms delay)
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
            onSuccess: (result) => {
              // Only update if this is still the latest save
              if (currentSaveId === saveCounterRef.current) {
                setSaveStatus("saved");

                // Schedule cleanup if tags were removed
                // This reduces performance impact by avoiding unnecessary cleanup operations
                // Using the scheduler ensures:
                // - Multiple rapid updates are debounced into a single cleanup
                // - Cleanup can be cancelled if component is unmounted
                // - No race conditions from concurrent cleanups
                if (result.tagsWereRemoved) {
                  cleanupSchedulerRef.current.scheduleCleanup(
                    () => cleanupUnusedTags(),
                    1000, // 1000ms delay (same as note save debounce)
                  );
                }
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
      }, 1000);
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

  // Cleanup: clear pending timeout and cancel scheduled cleanups on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      cleanupSchedulerRef.current.cancel();
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
