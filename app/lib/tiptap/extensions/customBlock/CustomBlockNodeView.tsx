import {
  NodeViewContent,
  type NodeViewProps,
  NodeViewWrapper,
} from "@tiptap/react";
import { GripVertical } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { BlockActionsMenu } from "@/components/editor/BlockActionsMenu";
import { useClickOutside } from "./useClickOutside";
import { useDragHandle } from "./useDragHandle";

export const CustomBlockNodeView: React.FC<NodeViewProps> = ({
  editor,
  getPos,
  node,
  deleteNode,
  selected,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showOnTouch, setShowOnTouch] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const dragHandleRef = useDragHandle({
    editor,
    getPos,
    node,
    wrapperRef,
  });

  const handleClickOutside = useCallback(() => {
    setShowOnTouch(false);
  }, []);

  useClickOutside({
    ref: wrapperRef,
    enabled: showOnTouch,
    onClickOutside: handleClickOutside,
  });

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // ドラッグハンドルまたはBlockActionsMenuからのイベントの場合は無視
    const target = e.target as HTMLElement;
    const isDragHandle = target.closest("[data-drag-handle]");
    const isMenuButton = target.closest('[role="button"]');

    if (isDragHandle || isMenuButton) {
      return;
    }

    setShowOnTouch(true);
  }, []);

  return (
    <NodeViewWrapper
      className="relative group hover:bg-accent/40 data-[selected]:bg-accent/40 transition-colors rounded"
      data-selected={selected || undefined}
    >
      <div ref={wrapperRef} onTouchStart={handleTouchStart}>
        {/* Drag handle and block actions menu - side by side */}
        <div
          contentEditable={false}
          className={`absolute right-2 bottom-2 z-10 flex items-center gap-1 transition-opacity ${
            isMenuOpen || selected || showOnTouch
              ? "opacity-100"
              : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {/* Block Actions Menu */}
          <BlockActionsMenu
            editor={editor}
            getPos={getPos}
            node={node}
            deleteNode={deleteNode}
            onOpenChange={setIsMenuOpen}
          />

          {/* Drag Handle */}
          <div
            ref={dragHandleRef}
            data-drag-handle
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 size-8 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4" />
          </div>
        </div>

        <NodeViewContent className="node-view-content" />
      </div>
    </NodeViewWrapper>
  );
};
