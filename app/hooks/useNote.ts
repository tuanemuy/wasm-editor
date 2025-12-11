import { useCallback, useEffect, useRef, useState } from "react";
import type { Container } from "@/core/application/container";
import { deleteNote } from "@/core/application/note/deleteNote";
import { exportNoteAsMarkdown } from "@/core/application/note/exportNoteAsMarkdown";
import { updateNote } from "@/core/application/note/updateNote";
import { cleanupUnusedTags } from "@/core/application/tag/cleanupUnusedTags";
import type { StructuredContent } from "@/core/domain/note/valueObject";
import { createNoteId } from "@/core/domain/note/valueObject";
import { formatError } from "@/presenters/error";
import type { Notification } from "@/presenters/notification";
import { request } from "@/presenters/request";

/**
 * Tag Cleanup Scheduler
 *
 * Manages delayed and debounced execution of tag cleanup operations in the presentation layer.
 * Prevents performance issues from excessive cleanup calls.
 */
class TagCleanupScheduler {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  scheduleCleanup(cleanupFn: () => Promise<void>, delayMs = 1000): void {
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
  saveStatus: SaveStatus;
  save: (content: StructuredContent, text: string) => Promise<void>;
  deleteNote: () => Promise<void>;
  exportNote: () => Promise<void>;
}

/**
 * Hook for fetching and managing a single note
 */
export function useNote(
  container: Container,
  noteId: string,
  { success, err }: UseNoteOptions = {},
): UseNoteResult {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

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
          updateNote(container, {
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
                    async () => {
                      await cleanupUnusedTags(container);
                    },
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
    [container, noteId, err],
  );

  // Delete note
  const _deleteNote = useCallback(async (): Promise<void> => {
    if (!noteId || deleting) return;
    setDeleting(true);

    await request(deleteNote(container, { id: createNoteId(noteId) }), {
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
  }, [container, noteId, deleting, success, err]);

  // Export note
  const exportNote = useCallback(async (): Promise<void> => {
    if (!noteId || exporting) return;

    setExporting(true);

    await request(
      exportNoteAsMarkdown(container, { id: createNoteId(noteId) }),
      {
        onSuccess: () => {
          success?.("Note exported as Markdown");
        },
        onError: (error) => {
          err?.(formatError(error), error);
        },
        onFinally: () => {
          setExporting(false);
        },
      },
    );
  }, [container, noteId, exporting, success, err]);

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
    save,
    deleteNote: _deleteNote,
    exportNote,
  };
}
