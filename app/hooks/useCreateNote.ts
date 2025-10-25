import { useCallback, useState } from "react";
import { withContainer } from "@/di";
import { createNote as createNoteService } from "@/core/application/note/createNote";
import type { Note } from "@/core/domain/note/entity";
import {
  defaultNotification,
  type Notification,
} from "@/presenters/notification";
import { request } from "@/presenters/request";

const createNote = withContainer(createNoteService);

export interface UseCreateNoteResult {
  creating: boolean;
  createNote: () => Promise<Note | null>;
}

/**
 * ノート作成を管理するフック
 */
export function useCreateNote({
  err,
}: Notification = defaultNotification): UseCreateNoteResult {
  const [creating, setCreating] = useState(false);

  const handleCreateNote = useCallback(async () => {
    setCreating(true);

    const note = await request(createNote({ content: "" }), {
      onError(error) {
        err?.("Failed to create note", error);
      },
    });

    setCreating(false);

    return note;
  }, [err]);

  return {
    creating,
    createNote: handleCreateNote,
  };
}
