import { useCallback, useState } from "react";
import { toast } from "sonner";
import { createNote } from "@/core/application/note/createNote";
import type { Note } from "@/core/domain/note/entity";
import { useAppContext } from "@/lib/context";

export interface UseCreateNoteResult {
  creating: boolean;
  createNote: () => Promise<Note>;
}

/**
 * ノート作成を管理するフック
 */
export function useCreateNote(): UseCreateNoteResult {
  const context = useAppContext();
  const [creating, setCreating] = useState(false);

  const handleCreateNote = useCallback(async (): Promise<Note> => {
    if (creating) {
      throw new Error("Already creating note");
    }

    setCreating(true);
    try {
      const note = await createNote(context, { content: "" });
      return note;
    } catch (error) {
      console.error("Failed to create note:", error);
      toast.error("Failed to create note");
      throw error;
    } finally {
      setCreating(false);
    }
  }, [context, creating]);

  return {
    creating,
    createNote: handleCreateNote,
  };
}
