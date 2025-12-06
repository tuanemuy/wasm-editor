import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { PilcrowIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ParagraphButtonProps = {
  editor: Editor;
};

/**
 * Paragraph button for the editor toolbar
 */
export function ParagraphButton({ editor }: ParagraphButtonProps) {
  const { isActive } = useEditorState({
    editor,
    selector: (ctx) => ({
      isActive: ctx.editor?.isActive("paragraph") || false,
    }),
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => editor.chain().focus().setParagraph().run()}
      data-active={isActive}
      className="data-[active=true]:bg-accent"
      title="Paragraph"
    >
      <PilcrowIcon className="h-4 w-4" />
    </Button>
  );
}
