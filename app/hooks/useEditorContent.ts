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
 * Detects changes during render, applies mutations in useEffect
 * @returns void
 */
export function useEditorContent({
  editor,
  content,
}: UseEditorContentOptions): void {
  const isInitialMount = useRef(true);
  const previousContent = useRef<StructuredContent>(content);
  const shouldUpdate = useRef(false);

  // Detect content changes during render (no mutations)
  if (editor && !editor.isDestroyed) {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousContent.current = content;
      shouldUpdate.current = false;
    } else if (previousContent.current !== content) {
      // Content reference has changed - flag for update
      shouldUpdate.current = true;
      previousContent.current = content;
    }
  }

  // Apply mutations in useEffect (side effects belong here)
  useEffect(() => {
    if (!editor || editor.isDestroyed || !shouldUpdate.current) {
      return;
    }

    shouldUpdate.current = false;

    // Update editor content
    const { from, to } = editor.state.selection;
    editor.commands.setContent(toTiptapContent(content), {
      emitUpdate: false,
    });

    // Restore cursor position if possible
    const docSize = editor.state.doc.content.size;
    const newFrom = Math.max(0, Math.min(from, docSize));
    const newTo = Math.max(0, Math.min(to, docSize));
    editor.commands.setTextSelection({ from: newFrom, to: newTo });
  });

  // Reset on editor change
  useEffect(() => {
    if (editor) {
      isInitialMount.current = true;
      previousContent.current = content;
      shouldUpdate.current = false;
    }
  }, [editor, content]);
}
