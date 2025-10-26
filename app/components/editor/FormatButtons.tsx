import type { Editor } from "@tiptap/react";
import {
  BoldIcon,
  CodeIcon,
  ItalicIcon,
  StrikethroughIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type FormatButtonsProps = {
  editor: Editor;
};

/**
 * Text formatting buttons for the editor toolbar
 */
export function FormatButtons({ editor }: FormatButtonsProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleBold().run()}
        data-active={editor.isActive("bold")}
        className="data-[active=true]:bg-muted"
        title="Bold"
      >
        <BoldIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        data-active={editor.isActive("italic")}
        className="data-[active=true]:bg-muted"
        title="Italic"
      >
        <ItalicIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        data-active={editor.isActive("strike")}
        className="data-[active=true]:bg-muted"
        title="Strikethrough"
      >
        <StrikethroughIcon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().toggleCode().run()}
        data-active={editor.isActive("code")}
        className="data-[active=true]:bg-muted"
        title="Code"
      >
        <CodeIcon className="h-4 w-4" />
      </Button>
    </>
  );
}
