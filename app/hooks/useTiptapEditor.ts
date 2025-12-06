import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Link from "@tiptap/extension-link";
import type { Editor } from "@tiptap/react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { common, createLowlight } from "lowlight";
import type { StructuredContent } from "@/core/domain/note/valueObject";
import { fromTiptapContent, toTiptapContent } from "@/presenters/note";

const lowlight = createLowlight(common);

type UseTiptapEditorOptions = {
  content: StructuredContent;
  onChange: (content: StructuredContent, text: string) => void;
  placeholder?: string;
  editable?: boolean;
  className?: string;
};

/**
 * Custom hook for managing Tiptap editor instance
 * @returns The Tiptap editor instance or null if not yet initialized
 */
export function useTiptapEditor({
  content,
  onChange,
  editable = true,
  className,
}: UseTiptapEditorOptions): Editor | null {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5],
        },
        link: false,
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Link.configure({
        autolink: true,
        linkOnPaste: true,
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
        class: className ?? "",
      },
    },
    immediatelyRender: false,
  });

  return editor;
}
