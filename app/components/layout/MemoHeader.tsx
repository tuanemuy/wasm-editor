import { EyeIcon, PencilIcon } from "lucide-react";
import { NoteActions } from "@/components/note/NoteActions";
import { NoteTitle } from "@/components/note/NoteTitle";
import { SaveStatusIndicator } from "@/components/note/SaveStatusIndicator";
import { Button } from "@/components/ui/button";
import type { SaveStatus } from "@/types";
import { BackButton } from "./BackButton";

export interface MemoHeaderProps {
  content: string;
  saveStatus: SaveStatus;
  exporting: boolean;
  isEditing: boolean;
  onToggleEdit: () => void;
  onExport: () => void;
  onDelete: () => void;
}

export function MemoHeader({
  content,
  saveStatus,
  exporting,
  isEditing,
  onToggleEdit,
  onExport,
  onDelete,
}: MemoHeaderProps) {
  return (
    <header className="border-b p-4 flex items-center gap-4">
      <BackButton />
      <NoteTitle content={content} />
      <div className="flex items-center gap-2">
        <Button
          variant={isEditing ? "default" : "outline"}
          size="sm"
          onClick={onToggleEdit}
          title={isEditing ? "閲覧モードに切り替え" : "編集モードに切り替え"}
        >
          {isEditing ? (
            <>
              <PencilIcon className="h-4 w-4 mr-2" />
              編集中
            </>
          ) : (
            <>
              <EyeIcon className="h-4 w-4 mr-2" />
              閲覧中
            </>
          )}
        </Button>
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
