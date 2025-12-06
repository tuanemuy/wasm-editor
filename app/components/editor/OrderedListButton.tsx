import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { ListOrderedIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type OrderedListButtonProps = {
  editor: Editor;
};

/**
 * Ordered list button for the editor toolbar
 */
export function OrderedListButton({ editor }: OrderedListButtonProps) {
  const { isActive } = useEditorState({
    editor,
    selector: (ctx) => ({
      isActive: ctx.editor?.isActive("orderedList") || false,
    }),
  });

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => editor.chain().focus().toggleOrderedList().run()}
      data-active={isActive}
      className="data-[active=true]:bg-accent"
      title="Ordered list"
    >
      <ListOrderedIcon className="h-4 w-4" />
    </Button>
  );
}
