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
 * @returns void
 */
export function useEditorContent({
  editor,
  content,
}: UseEditorContentOptions): void {
  const isInitialMount = useRef(true);
  const previousContent = useRef<StructuredContent>(content);

  // Synchronize content changes
  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      return;
    }

    // Skip initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousContent.current = content;
      return;
    }

    // Check if content has changed (by reference)
    if (previousContent.current === content) {
      return;
    }

    previousContent.current = content;

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
  }, [editor, content]);

  // Reset initial mount flag when editor instance changes
  // Note: We intentionally only depend on `editor` here, not `content`.
  // Including `content` would reset isInitialMount on every content change,
  // defeating the purpose of the initial mount check.
  // biome-ignore lint/correctness/useExhaustiveDependencies: content is intentionally excluded to prevent reset on every content change
  useEffect(() => {
    if (editor) {
      isInitialMount.current = true;
      previousContent.current = content;
    }
  }, [editor]);
}
