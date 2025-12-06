import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { ListIcon, ListOrderedIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ListButtonProps = {
  editor: Editor;
};

/**
 * List button that cycles through list types on click
 * Cycle: Paragraph → Bullet List → Ordered List → Paragraph
 */
export function ListButton({ editor }: ListButtonProps) {
  const { listType } = useEditorState({
    editor,
    selector: (ctx) => {
      if (ctx.editor?.isActive("bulletList")) {
        return { listType: "bullet" as const };
      }
      if (ctx.editor?.isActive("orderedList")) {
        return { listType: "ordered" as const };
      }
      return { listType: "none" as const };
    },
  });

  const cycleList = () => {
    switch (listType) {
      case "none":
        editor.chain().focus().toggleBulletList().run();
        break;
      case "bullet":
        editor.chain().focus().toggleBulletList().run();
        editor.chain().focus().toggleOrderedList().run();
        break;
      case "ordered":
        editor.chain().focus().toggleOrderedList().run();
        break;
    }
  };

  const getIcon = () => {
    switch (listType) {
      case "bullet":
        return <ListIcon className="h-4 w-4" />;
      case "ordered":
        return <ListOrderedIcon className="h-4 w-4" />;
      default:
        return <ListIcon className="h-4 w-4" />;
    }
  };

  const getTitle = () => {
    switch (listType) {
      case "bullet":
        return "Bullet list (click to cycle)";
      case "ordered":
        return "Ordered list (click to cycle)";
      default:
        return "List (click to cycle)";
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleList}
      data-active={listType !== "none"}
      className="data-[active=true]:bg-accent"
      title={getTitle()}
    >
      {getIcon()}
    </Button>
  );
}
