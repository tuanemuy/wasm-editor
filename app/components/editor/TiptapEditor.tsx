import { EditorContent, useEditorState } from "@tiptap/react";
import type { StructuredContent } from "@/core/domain/note/valueObject";
// import { useEditorContent } from "@/hooks/useEditorContent";
import { useIMEComposition } from "@/hooks/useIMEComposition";
import { useLinkHandler } from "@/hooks/useLinkHandler";
import { useTiptapEditor } from "@/hooks/useTiptapEditor";
import { BubbleMenu } from "./BubbleMenu";
import { FloatingMenu } from "./FloatingMenu";
import { LinkDialog } from "./LinkDialog";

type TiptapEditorProps = {
  content: StructuredContent;
  onChange: (content: StructuredContent, text: string) => void;
  placeholder?: string;
  onEditorReady?: (editor: ReturnType<typeof useTiptapEditor>) => void;
};

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  onEditorReady,
}: TiptapEditorProps) {
  // Initialize editor with configuration
  const editor = useTiptapEditor({
    content,
    onChange,
    placeholder,
    className:
      "article focus:outline-none max-w-none py-12 lg:py-12 px-4 lg:px-8 min-h-[calc(100vh-200px)]",
  });

  // Call onEditorReady when editor is initialized
  if (editor && onEditorReady) {
    onEditorReady(editor);
  }

  // Synchronize editor content with external state
  // useEditorContent({ editor, content });

  // Track IME composition state (Japanese input, etc.)
  const isComposing = useIMEComposition({ editor });

  // Handle link operations
  const { dialogState, openLinkDialog, handleConfirm, handleCancel } =
    useLinkHandler({ editor });

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
    <>
      {/* Editor content */}
      <EditorContent editor={editor} />
      {/* Bubble menu - shown on text selection */}
      {editor && <BubbleMenu editor={editor} onToggleLink={openLinkDialog} />}
      {/* Floating menu - hidden during IME composition */}
      {!isComposing && <FloatingMenu editor={editor} />}
      {/* Link dialog */}
      <LinkDialog
        isOpen={dialogState.isOpen}
        initialUrl={dialogState.initialUrl}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
