import { useCallback, useState } from "react";
import { createNote as createNoteService } from "@/core/application/note/createNote";
import type { Note } from "@/core/domain/note/entity";
import { withContainer } from "@/di";
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

    const note = await request(
      createNote({ content: { type: "doc", content: [] }, text: "" }),
      {
        onError(error) {
          err?.("Failed to create note", error);
        },
        onFinally() {
          setCreating(false);
        },
      },
    );

    return note;
  }, [err]);

  return {
    creating,
    createNote: handleCreateNote,
  };
}
