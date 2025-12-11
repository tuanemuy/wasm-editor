import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import {
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  Heading5Icon,
  HeadingIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type HeadingButtonsProps = {
  editor: Editor;
};

/**
 * Heading button that cycles through heading levels on click
 * Cycle: Paragraph → H1 → H2 → H3 → H4 → H5 → Paragraph
 */
export function HeadingButtons({ editor }: HeadingButtonsProps) {
  const { currentLevel, isHeadingActive } = useEditorState({
    editor,
    selector: (ctx) => {
      let level = 0;
      for (let i = 1; i <= 5; i++) {
        if (ctx.editor?.isActive("heading", { level: i })) {
          level = i;
          break;
        }
      }
      return {
        currentLevel: level,
        isHeadingActive: level > 0,
      };
    },
  });

  const cycleHeading = () => {
    const nextLevel = currentLevel === 5 ? 0 : currentLevel + 1;

    if (nextLevel === 0) {
      editor.chain().focus().setParagraph().run();
    } else {
      editor
        .chain()
        .focus()
        .setHeading({ level: nextLevel as 1 | 2 | 3 | 4 | 5 })
        .run();
    }
  };

  const getIcon = () => {
    switch (currentLevel) {
      case 1:
        return <Heading1Icon className="h-4 w-4" />;
      case 2:
        return <Heading2Icon className="h-4 w-4" />;
      case 3:
        return <Heading3Icon className="h-4 w-4" />;
      case 4:
        return <Heading4Icon className="h-4 w-4" />;
      case 5:
        return <Heading5Icon className="h-4 w-4" />;
      default:
        return <HeadingIcon className="h-4 w-4" />;
    }
  };

  const getTitle = () => {
    if (currentLevel === 0) return "Heading (click to cycle)";
    return `Heading ${currentLevel} (click to cycle)`;
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={cycleHeading}
      data-active={isHeadingActive}
      className="data-[active=true]:bg-accent"
      title={getTitle()}
    >
      {getIcon()}
    </Button>
  );
}
