import type { Editor } from "@tiptap/react";
import { useEffect } from "react";

type UseEditorEditableOptions = {
  editor: Editor | null;
  editable: boolean;
};

/**
 * Custom hook for managing editor editable state
 * @returns void
 */
export function useEditorEditable({
  editor,
  editable,
}: UseEditorEditableOptions): void {
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(editable);
  }, [editable, editor]);
}
