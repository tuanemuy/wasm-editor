import type { Editor } from "@tiptap/react";
import { ListIcon, ListOrderedIcon, QuoteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type ListButtonsProps = {
  editor: Editor;
};

/**
 * List and blockquote buttons for the editor toolbar
 */
export function ListButtons({ editor }: ListButtonsProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        data-active={editor.isActive("bulletList")}
        className="data-[active=true]:bg-muted"
        title="Bullet list"
      >
        <ListIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        data-active={editor.isActive("orderedList")}
        className="data-[active=true]:bg-muted"
        title="Ordered list"
      >
        <ListOrderedIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        data-active={editor.isActive("blockquote")}
        className="data-[active=true]:bg-muted"
        title="Quote"
      >
        <QuoteIcon className="h-4 w-4" />
      </Button>
    </>
  );
}
