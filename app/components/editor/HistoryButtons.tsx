import type { Editor } from "@tiptap/react";
import { Redo2Icon, Undo2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

type HistoryButtonsProps = {
  editor: Editor;
};

/**
 * Undo and Redo buttons for the editor toolbar
 */
export function HistoryButtons({ editor }: HistoryButtonsProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo2Icon className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo2Icon className="h-4 w-4" />
      </Button>
    </>
  );
}
