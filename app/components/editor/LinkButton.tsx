import type { Editor } from "@tiptap/react";
import { LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type LinkButtonProps = {
  editor: Editor;
  onToggleLink: () => void;
};

/**
 * Link button for the editor toolbar
 */
export function LinkButton({ editor, onToggleLink }: LinkButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onToggleLink}
      data-active={editor.isActive("link")}
      className="data-[active=true]:bg-muted"
      title="Link"
    >
      <LinkIcon className="h-4 w-4" />
    </Button>
  );
}
