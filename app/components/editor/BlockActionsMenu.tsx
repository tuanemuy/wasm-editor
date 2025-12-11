import type { Node } from "@tiptap/pm/model";
import type { Editor } from "@tiptap/react";
import {
  AlignLeft,
  Code2,
  Copy,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  List,
  ListOrdered,
  MoreVertical,
  Quote,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type BlockActionsMenuProps = {
  editor: Editor;
  getPos: () => number | undefined;
  node: Node;
  deleteNode: () => void;
  onOpenChange?: (open: boolean) => void;
};

export function BlockActionsMenu({
  editor,
  getPos,
  node,
  deleteNode,
  onOpenChange,
}: BlockActionsMenuProps) {
  const handleTurnInto = (action: () => void) => {
    action();
  };

  const handleDuplicate = () => {
    const pos = getPos();
    if (typeof pos === "number") {
      editor
        .chain()
        .focus()
        .insertContentAt(pos + node.nodeSize, {
          type: "customBlock",
          content: node.content.toJSON(),
        })
        .run();
    }
  };

  const handleDelete = () => {
    deleteNode();
  };

  const handleCopy = () => {
    const pos = getPos();
    if (typeof pos === "number") {
      const { from, to } = {
        from: pos,
        to: pos + node.nodeSize,
      };
      const text = editor.state.doc.textBetween(from, to);
      navigator.clipboard.writeText(text);
    }
  };

  return (
    <DropdownMenu onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon-sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        {/* Block Type Conversion */}
        <DropdownMenuLabel>Turn into</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() =>
              handleTurnInto(() => editor.chain().focus().setParagraph().run())
            }
          >
            <AlignLeft className="mr-2 h-4 w-4" />
            <span>Paragraph</span>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Heading1 className="mr-2 h-4 w-4" />
              <span>Heading</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                <DropdownMenuItem
                  onClick={() =>
                    handleTurnInto(() =>
                      editor.chain().focus().toggleHeading({ level: 1 }).run(),
                    )
                  }
                >
                  <Heading1 className="mr-2 h-4 w-4" />
                  <span>Heading 1</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleTurnInto(() =>
                      editor.chain().focus().toggleHeading({ level: 2 }).run(),
                    )
                  }
                >
                  <Heading2 className="mr-2 h-4 w-4" />
                  <span>Heading 2</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleTurnInto(() =>
                      editor.chain().focus().toggleHeading({ level: 3 }).run(),
                    )
                  }
                >
                  <Heading3 className="mr-2 h-4 w-4" />
                  <span>Heading 3</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleTurnInto(() =>
                      editor.chain().focus().toggleHeading({ level: 4 }).run(),
                    )
                  }
                >
                  <Heading4 className="mr-2 h-4 w-4" />
                  <span>Heading 4</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleTurnInto(() =>
                      editor.chain().focus().toggleHeading({ level: 5 }).run(),
                    )
                  }
                >
                  <Heading5 className="mr-2 h-4 w-4" />
                  <span>Heading 5</span>
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
          <DropdownMenuItem
            onClick={() =>
              handleTurnInto(() =>
                editor.chain().focus().toggleBulletList().run(),
              )
            }
          >
            <List className="mr-2 h-4 w-4" />
            <span>Bullet List</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              handleTurnInto(() =>
                editor.chain().focus().toggleOrderedList().run(),
              )
            }
          >
            <ListOrdered className="mr-2 h-4 w-4" />
            <span>Ordered List</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              handleTurnInto(() =>
                editor.chain().focus().toggleBlockquote().run(),
              )
            }
          >
            <Quote className="mr-2 h-4 w-4" />
            <span>Quote</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() =>
              handleTurnInto(() =>
                editor.chain().focus().toggleCodeBlock().run(),
              )
            }
          >
            <Code2 className="mr-2 h-4 w-4" />
            <span>Code Block</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        {/* Block Actions */}
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Duplicate</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
