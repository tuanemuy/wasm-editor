import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import type { Editor } from "@tiptap/react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { StructuredContent } from "@/core/domain/note/valueObject";
import { fromTiptapContent, toTiptapContent } from "@/presenters/note";

type UseTiptapEditorOptions = {
  content: StructuredContent;
  onChange: (content: StructuredContent, text: string) => void;
  placeholder?: string;
  editable?: boolean;
};

/**
 * Custom hook for managing Tiptap editor instance
 * @returns The Tiptap editor instance or null if not yet initialized
 */
export function useTiptapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  editable = true,
}: UseTiptapEditorOptions): Editor | null {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: !editable,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
    ],
    content: toTiptapContent(content),
    editable,
    onUpdate: ({ editor: updatedEditor }) => {
      onChange(
        fromTiptapContent(updatedEditor.getJSON()),
        updatedEditor.getText(),
      );
    },
    editorProps: {
      attributes: {
        class:
          "article focus:outline-none max-w-none py-8 px-4 min-h-[calc(100vh-200px)]",
      },
    },
    immediatelyRender: false,
  });

  return editor;
}
