import type { Editor } from "@tiptap/react";
import { Heading1Icon, Heading2Icon, Heading3Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

type HeadingButtonsProps = {
  editor: Editor;
};

/**
 * Heading level buttons for the editor toolbar
 */
export function HeadingButtons({ editor }: HeadingButtonsProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        data-active={editor.isActive("heading", { level: 1 })}
        className="data-[active=true]:bg-muted"
        title="Heading 1"
      >
        <Heading1Icon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        data-active={editor.isActive("heading", { level: 2 })}
        className="data-[active=true]:bg-muted"
        title="Heading 2"
      >
        <Heading2Icon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        data-active={editor.isActive("heading", { level: 3 })}
        className="data-[active=true]:bg-muted"
        title="Heading 3"
      >
        <Heading3Icon className="h-4 w-4" />
      </Button>
    </>
  );
}
