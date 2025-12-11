import type { StructuredContent } from "@/core/domain/note/valueObject";
import { extractTitle } from "@/presenters/note";

export interface NoteTitleProps {
  content: StructuredContent;
}

export function NoteTitle({ content }: NoteTitleProps) {
  return <h1 className="font-semibold truncate">{extractTitle(content)}</h1>;
}
