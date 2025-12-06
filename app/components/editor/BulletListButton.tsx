import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type BulletListButtonProps = {
  editor: Editor;
};

/**
 * Bullet list button for the editor toolbar
 */
export function BulletListButton({ editor }: BulletListButtonProps) {
  const { isActive } = useEditorState({
    editor,
    selector: (ctx) => ({
      isActive: ctx.editor?.isActive("bulletList") || false,
    }),
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => editor.chain().focus().toggleBulletList().run()}
      data-active={isActive}
      className="data-[active=true]:bg-accent"
      title="Bullet list"
    >
      <ListIcon className="h-4 w-4" />
    </Button>
  );
}
