import type { Editor } from "@tiptap/react";
import { useEffect, useRef } from "react";
import type { StructuredContent } from "@/core/domain/note/valueObject";
import { toTiptapContent } from "@/presenters/note";

type UseEditorContentOptions = {
  editor: Editor | null;
  content: StructuredContent;
};

/**
 * Custom hook for synchronizing editor content with external state
 * Uses direct prop comparison instead of useEffect for better performance
 * @returns void
 */
export function useEditorContent({
  editor,
  content,
}: UseEditorContentOptions): void {
  const isInitialMount = useRef(true);
  const previousContent = useRef<StructuredContent>(content);

  // Direct synchronization without useEffect
  // This runs during render phase and is more efficient
  if (editor && !editor.isDestroyed) {
    // Skip update on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousContent.current = content;
    } else if (previousContent.current !== content) {
      // Content reference has changed - update editor
      const { from, to } = editor.state.selection;
      editor.commands.setContent(toTiptapContent(content), {
        emitUpdate: false,
      });
      // Restore cursor position if possible
      const docSize = editor.state.doc.content.size;
      const newFrom = Math.max(0, Math.min(from, docSize));
      const newTo = Math.max(0, Math.min(to, docSize));
      editor.commands.setTextSelection({ from: newFrom, to: newTo });
      previousContent.current = content;
    }
  }

  // Reset on editor change
  useEffect(() => {
    if (editor) {
      isInitialMount.current = true;
      previousContent.current = content;
    }
  }, [editor, content]);
}
