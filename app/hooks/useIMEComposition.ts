import type { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";

type UseIMECompositionOptions = {
  editor: Editor | null;
};

/**
 * Custom hook for tracking IME composition state (Japanese input, etc.)
 * @returns boolean indicating whether IME composition is active
 */
export function useIMEComposition({
  editor,
}: UseIMECompositionOptions): boolean {
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const editorElement = editor.view.dom;

    const handleCompositionStart = () => {
      setIsComposing(true);
    };

    const handleCompositionEnd = () => {
      setIsComposing(false);
    };

    editorElement.addEventListener("compositionstart", handleCompositionStart);
    editorElement.addEventListener("compositionend", handleCompositionEnd);

    return () => {
      editorElement.removeEventListener(
        "compositionstart",
        handleCompositionStart,
      );
      editorElement.removeEventListener("compositionend", handleCompositionEnd);
    };
  }, [editor]);

  return isComposing;
}
