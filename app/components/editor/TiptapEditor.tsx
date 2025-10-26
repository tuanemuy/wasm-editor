import { EditorContent, useEditorState } from "@tiptap/react";
import type { StructuredContent } from "@/core/domain/note/valueObject";
import { useEditorContent } from "@/hooks/useEditorContent";
import { useEditorEditable } from "@/hooks/useEditorEditable";
import { useLinkHandler } from "@/hooks/useLinkHandler";
import { useTiptapEditor } from "@/hooks/useTiptapEditor";
import { EditorToolbar } from "./EditorToolbar";

type TiptapEditorProps = {
  content: StructuredContent;
  onChange: (content: StructuredContent, text: string) => void;
  placeholder?: string;
  editable?: boolean;
};

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  editable = true,
}: TiptapEditorProps) {
  // Initialize editor with configuration
  const editor = useTiptapEditor({
    content,
    onChange,
    placeholder,
    editable,
  });

  // Synchronize editor content with external state
  useEditorContent({ editor, content });

  // Manage editable state
  useEditorEditable({ editor, editable });

  // Handle link operations
  const { toggleLink } = useLinkHandler({ editor });

  // Use useEditorState to track selection changes for toolbar state updates
  // This only re-renders when the selection changes, not on every transaction
  useEditorState({
    editor,
    selector: (ctx) => ({
      selection: ctx.editor?.state.selection,
    }),
  });

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar - only show in edit mode */}
      {editable && <EditorToolbar editor={editor} onToggleLink={toggleLink} />}

      {/* Editor content */}
      <EditorContent editor={editor} className="flex-1 overflow-auto" />
    </div>
  );
}
