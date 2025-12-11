import { useCallback, useState } from "react";
import type { Container } from "@/core/application/container";
import { createNote } from "@/core/application/note/createNote";
import type { Note } from "@/core/domain/note/entity";
import {
  defaultNotification,
  type Notification,
} from "@/presenters/notification";
import { request } from "@/presenters/request";

export interface UseCreateNoteResult {
  creating: boolean;
  createNote: () => Promise<Note | null>;
}

/**
 * ノート作成を管理するフック
 */
export function useCreateNote(
  container: Container,
  { err }: Notification = defaultNotification,
): UseCreateNoteResult {
  const [creating, setCreating] = useState(false);

  const handleCreateNote = useCallback(async () => {
    setCreating(true);

    const note = await request(
      createNote(container, {
        content: { type: "doc", content: [] },
        text: "",
      }),
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
  }, [container, err]);

  return {
    creating,
    createNote: handleCreateNote,
  };
}
