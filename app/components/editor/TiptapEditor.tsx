import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  BoldIcon,
  CodeIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  Redo2Icon,
  StrikethroughIcon,
  Undo2Icon,
} from "lucide-react";
import { useEffect, useRef } from "react";
import type { Content } from "@tiptap/core";
import type { StructuredContent } from "@/core/domain/note/valueObject";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

/**
 * Type adapter to convert between domain StructuredContent and Tiptap's Content type.
 * StructuredContent is a domain-level abstraction that's structurally compatible with
 * Tiptap's JSON format, but TypeScript requires explicit conversion.
 */
function toTiptapContent(content: StructuredContent): Content {
  // Runtime validation: ensure content has the expected structure
  if (!content || typeof content !== "object" || !("type" in content)) {
    throw new Error("Invalid content structure");
  }
  return content as unknown as Content;
}

/**
 * Type adapter to convert from Tiptap's Content to domain StructuredContent.
 */
function fromTiptapContent(content: Content): StructuredContent {
  // Runtime validation: ensure content has the expected structure
  const json = content as Record<string, unknown>;
  if (!json || typeof json !== "object" || !("type" in json)) {
    throw new Error("Invalid Tiptap content structure");
  }
  return json as StructuredContent;
}

type TiptapEditorProps = {
  content: StructuredContent;
  onChange: (content: StructuredContent, text: string) => void;
  placeholder?: string;
  editable?: boolean;
};

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  editable = true,
}: TiptapEditorProps) {
  const isInitialMount = useRef(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: !editable,
        HTMLAttributes: {
          class: "text-primary underline",
        },
      }),
    ],
    content: toTiptapContent(content),
    editable,
    onUpdate: ({ editor: updatedEditor }) => {
      onChange(
        fromTiptapContent(updatedEditor.getJSON()),
        updatedEditor.getText(),
      );
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none max-w-none p-4 min-h-[calc(100vh-200px)]",
      },
    },
    immediatelyRender: false,
  });

  // Update editor content when prop changes (but avoid unnecessary updates)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    // Skip update on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const currentContent = JSON.stringify(editor.getJSON());
    const newContent = JSON.stringify(content);
    if (newContent !== currentContent) {
      const { from, to } = editor.state.selection;
      editor.commands.setContent(toTiptapContent(content), { emitUpdate: false });
      // Restore cursor position if possible
      const newFrom = Math.min(from, editor.state.doc.content.size - 1);
      const newTo = Math.min(to, editor.state.doc.content.size - 1);
      editor.commands.setTextSelection({ from: newFrom, to: newTo });
    }
  }, [content, editor]);

  // Update editable state when prop changes
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    editor.setEditable(editable);
  }, [editable, editor]);

  if (!editor) {
    return null;
  }

  const toggleLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    // User cancelled
    if (url === null) {
      return;
    }

    // Remove link if empty
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // Validate URL
    try {
      const parsed = new URL(url);
      // Prevent javascript: URLs for security
      if (parsed.protocol === "javascript:") {
        alert("javascript: URLs are not allowed for security reasons");
        return;
      }
    } catch {
      // Invalid URL format - show error
      alert("Invalid URL format. Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar - only show in edit mode */}
      {editable && (
        <div className="border-b p-2 flex items-center gap-1 flex-wrap">
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

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            data-active={editor.isActive("heading", { level: 1 })}
            className="data-[active=true]:bg-muted"
            title="Heading 1"
          >
            <Heading1Icon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            data-active={editor.isActive("heading", { level: 2 })}
            className="data-[active=true]:bg-muted"
            title="Heading 2"
          >
            <Heading2Icon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            data-active={editor.isActive("heading", { level: 3 })}
            className="data-[active=true]:bg-muted"
            title="Heading 3"
          >
            <Heading3Icon className="h-4 w-4" />
          </Button>

          <Separator orientation="vertical" className="mx-1 h-6" />

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

          <Separator orientation="vertical" className="mx-1 h-6" />

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

          <Separator orientation="vertical" className="mx-1 h-6" />

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLink}
            data-active={editor.isActive("link")}
            className="data-[active=true]:bg-muted"
            title="Link"
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Editor content */}
      <EditorContent editor={editor} className="flex-1 overflow-auto" />
    </div>
  );
}
