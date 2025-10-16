import { extractTitle } from "@/lib/note-utils";

export interface NoteTitleProps {
  content: string;
}

export function NoteTitle({ content }: NoteTitleProps) {
  return (
    <h1 className="text-xl font-semibold flex-1 truncate">
      {extractTitle(content)}
    </h1>
  );
}
