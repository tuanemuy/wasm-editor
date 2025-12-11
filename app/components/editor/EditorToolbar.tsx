import type { Editor } from "@tiptap/react";
import { BlockquoteButton } from "./BlockquoteButton";
import { CodeBlockButton } from "./CodeBlockButton";
import { HeadingButtons } from "./HeadingButtons";
import { HistoryButtons } from "./HistoryButtons";
import { ListButton } from "./ListButton";
import { ListIndentButtons } from "./ListIndentButtons";
import { ParagraphButton } from "./ParagraphButton";

type EditorToolbarProps = {
  editor: Editor;
  onToggleLink: () => void;
};

/**
 * The main toolbar component for the editor
 */
export function EditorToolbar({ editor }: EditorToolbarProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <HistoryButtons editor={editor} />
      <ParagraphButton editor={editor} />
      <HeadingButtons editor={editor} />
      <ListButton editor={editor} />
      <ListIndentButtons editor={editor} />
      <CodeBlockButton editor={editor} />
      <BlockquoteButton editor={editor} />
    </div>
  );
}
