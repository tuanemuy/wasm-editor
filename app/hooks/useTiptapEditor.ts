import type { Content } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import type { Editor } from "@tiptap/react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { StructuredContent } from "@/core/domain/note/valueObject";

/**
 * Type adapter to convert between domain StructuredContent and Tiptap's Content type.
 * StructuredContent is a domain-level abstraction that's structurally compatible with
 * Tiptap's JSON format, but TypeScript requires explicit conversion.
 */
export function toTiptapContent(content: StructuredContent): Content {
  // Runtime validation: ensure content has the expected structure
  if (!content || typeof content !== "object") {
    throw new Error("Invalid content structure: must be an object");
  }
  if (!("type" in content) || typeof content.type !== "string") {
    throw new Error(
      "Invalid content structure: missing or invalid 'type' field",
    );
  }
  if ("content" in content && !Array.isArray(content.content)) {
    throw new Error("Invalid content structure: 'content' must be an array");
  }
  return content as unknown as Content;
}

/**
 * Type adapter to convert from Tiptap's Content to domain StructuredContent.
 */
export function fromTiptapContent(content: Content): StructuredContent {
  // Runtime validation: ensure content has the expected structure
  const json = content as Record<string, unknown>;
  if (!json || typeof json !== "object") {
    throw new Error("Invalid Tiptap content structure: must be an object");
  }
  if (!("type" in json) || typeof json.type !== "string") {
    throw new Error(
      "Invalid Tiptap content structure: missing or invalid 'type' field",
    );
  }
  if ("content" in json && !Array.isArray(json.content)) {
    throw new Error(
      "Invalid Tiptap content structure: 'content' must be an array",
    );
  }
  return json as StructuredContent;
}

type UseTiptapEditorOptions = {
  content: StructuredContent;
  onChange: (content: StructuredContent, text: string) => void;
  placeholder?: string;
  editable?: boolean;
};

/**
 * Custom hook for managing Tiptap editor instance
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
