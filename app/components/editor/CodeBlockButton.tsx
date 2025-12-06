import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { CodeIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type CodeBlockButtonProps = {
  editor: Editor;
};

/**
 * Code block button for the editor toolbar
 */
export function CodeBlockButton({ editor }: CodeBlockButtonProps) {
  const { isActive } = useEditorState({
    editor,
    selector: (ctx) => ({
      isActive: ctx.editor?.isActive("codeBlock") || false,
    }),
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      data-active={isActive}
      className="data-[active=true]:bg-accent"
      title="Code block"
    >
      <CodeIcon className="h-4 w-4" />
    </Button>
  );
}
