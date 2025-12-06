import type { Node } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/react";
import { GripVertical } from "lucide-react";
import { BlockActionsMenu } from "./BlockActionsMenu";

type BlockActionPanelProps = {
  editor: Editor;
  getPos: () => number | undefined;
  node: Node;
  deleteNode: () => void;
  onOpenChange?: (open: boolean) => void;
};

export function BlockActionPanel({
  editor,
  getPos,
  node,
  deleteNode,
  onOpenChange,
}: BlockActionPanelProps) {
  return (
    <div className="flex items-center gap-1 rounded-md bg-background/80 backdrop-blur-sm border border-border shadow-sm p-1">
      {/* Drag Handle */}
      <div
        data-drag-handle
        className="flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent cursor-grab active:cursor-grabbing transition-colors"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Block Actions Menu */}
      <BlockActionsMenu
        editor={editor}
        getPos={getPos}
        node={node}
        deleteNode={deleteNode}
        onOpenChange={onOpenChange}
      />
    </div>
  );
}
