import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { QuoteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type BlockquoteButtonProps = {
  editor: Editor;
};

/**
 * Blockquote button for the editor toolbar
 */
export function BlockquoteButton({ editor }: BlockquoteButtonProps) {
  const { isActive } = useEditorState({
    editor,
    selector: (ctx) => ({
      isActive: ctx.editor?.isActive("blockquote") || false,
    }),
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => editor.chain().focus().toggleBlockquote().run()}
      data-active={isActive}
      className="data-[active=true]:bg-accent"
      title="Quote"
    >
      <QuoteIcon className="h-4 w-4" />
    </Button>
  );
}
