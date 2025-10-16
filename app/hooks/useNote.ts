import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { deleteNote as deleteNoteService } from "@/core/application/note/deleteNote";
import { exportNoteAsMarkdown } from "@/core/application/note/exportNoteAsMarkdown";
import { getNote } from "@/core/application/note/getNote";
import { updateNote } from "@/core/application/note/updateNote";
import type { Note } from "@/core/domain/note/entity";
import {
  createNoteContent,
  createNoteId,
} from "@/core/domain/note/valueObject";
import { useAppContext } from "@/lib/context";

export interface UseNoteResult {
  note: Note | null;
  loading: boolean;
  error: Error | null;
  deleting: boolean;
  exporting: boolean;
  updateContent: (content: string) => Promise<void>;
  deleteNote: () => Promise<void>;
  exportNote: () => Promise<void>;
}

/**
 * Hook for fetching and managing a single note
 */
export function useNote(noteId: string | undefined): UseNoteResult {
  const context = useAppContext();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load note
  useEffect(() => {
    if (!noteId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    getNote(context, { id: createNoteId(noteId) })
      .then((loadedNote) => {
        setNote(loadedNote);
      })
      .catch((err) => {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Failed to load note:", error);
        setError(error);
        toast.error("Failed to load note");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [context, noteId]);

  // Update note content
  const updateContent = useCallback(
    async (content: string) => {
      if (!noteId) return;

      try {
        const noteContent = createNoteContent(content);
        await updateNote(context, {
          id: createNoteId(noteId),
          content,
        });
        setNote((prev) => (prev ? { ...prev, content: noteContent } : null));
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error("Failed to update note:", error);
        toast.error("Failed to update note");
        throw error;
      }
    },
    [context, noteId],
  );

  // Delete note
  const deleteNote = useCallback(async (): Promise<void> => {
    if (!noteId || deleting) return;

    setDeleting(true);
    try {
      await deleteNoteService(context, { id: createNoteId(noteId) });
      toast.success("Note deleted");
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Failed to delete note:", error);
      toast.error("Failed to delete note");
      throw error;
    } finally {
      setDeleting(false);
    }
  }, [context, noteId, deleting]);

  // Export note
  const exportNote = useCallback(async (): Promise<void> => {
    if (!noteId || exporting) return;

    setExporting(true);
    try {
      await exportNoteAsMarkdown(context, { id: createNoteId(noteId) });
      toast.success("Note exported");
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error("Failed to export note:", error);
      toast.error("Failed to export note");
      throw error;
    } finally {
      setExporting(false);
    }
  }, [context, noteId, exporting]);

  return {
    note,
    loading,
    error,
    deleting,
    exporting,
    updateContent,
    deleteNote,
    exportNote,
  };
}
