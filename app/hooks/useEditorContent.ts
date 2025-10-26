import type { Editor } from "@tiptap/react";
import { useEffect, useRef } from "react";
import type { StructuredContent } from "@/core/domain/note/valueObject";
import { toTiptapContent } from "./useTiptapEditor";

type UseEditorContentOptions = {
  editor: Editor | null;
  content: StructuredContent;
};

/**
 * Custom hook for synchronizing editor content with external state
 */
export function useEditorContent({
  editor,
  content,
}: UseEditorContentOptions): void {
  const isInitialMount = useRef(true);

  // Update editor content when prop changes (but avoid unnecessary updates)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    // Skip update on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentContent = JSON.stringify(editor.getJSON());
    const newContent = JSON.stringify(content);
    if (newContent !== currentContent) {
      const { from, to } = editor.state.selection;
      editor.commands.setContent(toTiptapContent(content), {
        emitUpdate: false,
      });
      // Restore cursor position if possible
      const newFrom = Math.min(from, editor.state.doc.content.size - 1);
      const newTo = Math.min(to, editor.state.doc.content.size - 1);
      editor.commands.setTextSelection({ from: newFrom, to: newTo });
    }
  }, [content, editor]);
}
