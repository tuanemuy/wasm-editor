import type { Editor } from "@tiptap/react";
import { useEffect, useMemo, useRef } from "react";
import type { StructuredContent } from "@/core/domain/note/valueObject";
import { toTiptapContent } from "@/presenters/note";

type UseEditorContentOptions = {
  editor: Editor | null;
  content: StructuredContent;
};

/**
 * Deep equality check for StructuredContent objects
 * More efficient than JSON.stringify for content comparison
 */
function isContentEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false;
    if (Array.isArray(aObj[key]) && Array.isArray(bObj[key])) {
      const aArr = aObj[key] as unknown[];
      const bArr = bObj[key] as unknown[];
      if (aArr.length !== bArr.length) return false;
      for (let i = 0; i < aArr.length; i++) {
        if (!isContentEqual(aArr[i], bArr[i])) return false;
      }
    } else if (!isContentEqual(aObj[key], bObj[key])) {
      return false;
    }
  }

  return true;
}

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

  // Memoize content equality check
  const hasContentChanged = useMemo(() => {
    if (isInitialMount.current) return false;
    return !isContentEqual(previousContent.current, content);
  }, [content]);

  // Update editor content when prop changes (but avoid unnecessary updates)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    // Skip update on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousContent.current = content;
      return;
    }

    if (hasContentChanged) {
      const { from, to } = editor.state.selection;
      editor.commands.setContent(toTiptapContent(content), {
        emitUpdate: false,
      });
      // Restore cursor position if possible
      const newFrom = Math.min(from, editor.state.doc.content.size - 1);
      const newTo = Math.min(to, editor.state.doc.content.size - 1);
      editor.commands.setTextSelection({ from: newFrom, to: newTo });
      previousContent.current = content;
    }
  }, [content, editor, hasContentChanged]);
}
