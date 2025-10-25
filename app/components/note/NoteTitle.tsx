import type { StructuredContent } from "@/core/domain/note/valueObject";
import { extractTitle } from "@/lib/note-utils";

export interface NoteTitleProps {
  content: StructuredContent;
}

export function NoteTitle({ content }: NoteTitleProps) {
  return (
    <h1 className="text-xl font-semibold flex-1 truncate">
      {extractTitle(content)}
    </h1>
  );
}
