import type { Editor } from "@tiptap/react";
import { FormatButtons } from "./FormatButtons";
import { HeadingButtons } from "./HeadingButtons";
import { HistoryButtons } from "./HistoryButtons";
import { LinkButton } from "./LinkButton";
import { ListButtons } from "./ListButtons";
import { ToolbarGroup } from "./ToolbarGroup";

type EditorToolbarProps = {
  editor: Editor;
  onToggleLink: () => void;
};

/**
 * The main toolbar component for the editor
 */
export function EditorToolbar({ editor, onToggleLink }: EditorToolbarProps) {
  return (
    <div className="border-b p-2 flex items-center gap-1 overflow-x-auto">
      <ToolbarGroup>
        <HistoryButtons editor={editor} />
      </ToolbarGroup>

      <ToolbarGroup>
        <HeadingButtons editor={editor} />
      </ToolbarGroup>

      <ToolbarGroup>
        <FormatButtons editor={editor} />
      </ToolbarGroup>

      <ToolbarGroup>
        <ListButtons editor={editor} />
      </ToolbarGroup>

      <ToolbarGroup showSeparator={false}>
        <LinkButton editor={editor} onToggleLink={onToggleLink} />
      </ToolbarGroup>
    </div>
  );
}
