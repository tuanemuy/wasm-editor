import type { Editor } from "@tiptap/react";
import { BubbleMenu as TiptapBubbleMenu } from "@tiptap/react/menus";
import {
  AlignLeft,
  Bold,
  ChevronDown,
  Code,
  Code2,
  Heading,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Strikethrough,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DropdownMenuContentWithoutPortal } from "@/components/ui/dropdown-menu-extended";
import { Separator } from "@/components/ui/separator";

type BubbleMenuProps = {
  editor: Editor;
  onToggleLink: () => void;
};

function getCurrentBlockType(editor: Editor): {
  label: string;
  icon: React.ReactNode;
} {
  if (editor.isActive("heading", { level: 1 })) {
    return { label: "Heading 1", icon: <Heading1 /> };
  }
  if (editor.isActive("heading", { level: 2 })) {
    return { label: "Heading 2", icon: <Heading2 /> };
  }
  if (editor.isActive("heading", { level: 3 })) {
    return { label: "Heading 3", icon: <Heading3 /> };
  }
  if (editor.isActive("heading", { level: 4 })) {
    return { label: "Heading 4", icon: <Heading4 /> };
  }
  if (editor.isActive("heading", { level: 5 })) {
    return { label: "Heading 5", icon: <Heading5 /> };
  }
  if (editor.isActive("bulletList")) {
    return { label: "Bullet List", icon: <List /> };
  }
  if (editor.isActive("orderedList")) {
    return { label: "Ordered List", icon: <ListOrdered /> };
  }
  if (editor.isActive("blockquote")) {
    return { label: "Quote", icon: <Quote /> };
  }
  if (editor.isActive("codeBlock")) {
    return { label: "Code Block", icon: <Code2 /> };
  }
  return { label: "Paragraph", icon: <Pilcrow /> };
}

export function BubbleMenu({ editor, onToggleLink }: BubbleMenuProps) {
  const currentBlockType = getCurrentBlockType(editor);

  return (
    <TiptapBubbleMenu
      editor={editor}
      className="flex items-center gap-1 rounded border bg-popover p-1 shadow"
    >
      {/* Turn Into */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" title="Turn into">
            {currentBlockType.icon}
            {currentBlockType.label}
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContentWithoutPortal align="start" className="w-48">
          <DropdownMenuItem
            onClick={() => editor.chain().focus().setParagraph().run()}
          >
            <AlignLeft />
            <span>Paragraph</span>
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Heading />
              <span>Heading</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 1 }).run()
                }
              >
                <Heading1 />
                <span>Heading 1</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 2 }).run()
                }
              >
                <Heading2 />
                <span>Heading 2</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 3 }).run()
                }
              >
                <Heading3 />
                <span>Heading 3</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 4 }).run()
                }
              >
                <Heading4 />
                <span>Heading 4</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  editor.chain().focus().toggleHeading({ level: 5 }).run()
                }
              >
                <Heading5 />
                <span>Heading 5</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleBulletList().run()}
          >
            <List />
            <span>Bullet List</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            <ListOrdered />
            <span>Ordered List</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
          >
            <Quote />
            <span>Quote</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          >
            <Code2 />
            <span>Code Block</span>
          </DropdownMenuItem>
        </DropdownMenuContentWithoutPortal>
      </DropdownMenu>

      <Separator orientation="vertical" />

      {/* Text Formatting */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        data-active={editor.isActive("bold")}
        className="data-[active=true]:bg-accent"
        title="Bold"
      >
        <Bold />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        data-active={editor.isActive("italic")}
        className="data-[active=true]:bg-accent"
        title="Italic"
      >
        <Italic />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        data-active={editor.isActive("strike")}
        className="data-[active=true]:bg-accent"
        title="Strikethrough"
      >
        <Strikethrough />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
        data-active={editor.isActive("code")}
        className="data-[active=true]:bg-accent"
        title="Code"
      >
        <Code />
      </Button>

      <Separator orientation="vertical" />

      {/* Link */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onToggleLink}
        data-active={editor.isActive("link")}
        className="data-[active=true]:bg-accent"
        title="Link"
      >
        <LinkIcon />
      </Button>
    </TiptapBubbleMenu>
  );
}
