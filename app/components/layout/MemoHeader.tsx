import { NoteActions } from "@/components/note/NoteActions";
import { NoteTitle } from "@/components/note/NoteTitle";
import { SaveStatusIndicator } from "@/components/note/SaveStatusIndicator";
import type { StructuredContent } from "@/core/domain/note/valueObject";
import type { SaveStatus } from "@/types";
import { BackButton } from "./BackButton";

export interface MemoHeaderProps {
  content: StructuredContent;
  saveStatus: SaveStatus;
  exporting: boolean;
  onExport: () => void;
  onDelete: () => void;
}

export function MemoHeader({
  content,
  saveStatus,
  exporting,
  onExport,
  onDelete,
}: MemoHeaderProps) {
  return (
    <header className="border-b p-4 flex items-center gap-4">
      <BackButton />
      <NoteTitle content={content} />
      <div className="flex items-center gap-2">
        <SaveStatusIndicator status={saveStatus} />
        <NoteActions
          exporting={exporting}
          onExport={onExport}
          onDelete={onDelete}
        />
      </div>
    </header>
  );
}
