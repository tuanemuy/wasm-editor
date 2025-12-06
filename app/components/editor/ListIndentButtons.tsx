import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { IndentDecreaseIcon, IndentIncreaseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ListIndentButtonsProps = {
  editor: Editor;
};

/**
 * List indent buttons for the editor toolbar
 * Shows only when editing a list item
 */
export function ListIndentButtons({ editor }: ListIndentButtonsProps) {
  const { isInList, canIndent, canOutdent } = useEditorState({
    editor,
    selector: (ctx) => ({
      isInList:
        ctx.editor?.isActive("bulletList") ||
        ctx.editor?.isActive("orderedList") ||
        false,
      canIndent: ctx.editor?.can().sinkListItem("listItem") || false,
      canOutdent: ctx.editor?.can().liftListItem("listItem") || false,
    }),
  });

  if (!isInList) {
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().liftListItem("listItem").run()}
        disabled={!canOutdent}
        title="Decrease indent"
      >
        <IndentDecreaseIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().sinkListItem("listItem").run()}
        disabled={!canIndent}
        title="Increase indent"
      >
        <IndentIncreaseIcon className="h-4 w-4" />
      </Button>
    </>
  );
}
