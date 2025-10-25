import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useDIContainer } from "@/context/di";
import { exportNoteAsMarkdown } from "@/core/application/note/exportNoteAsMarkdown";
import type { Note } from "@/core/domain/note/entity";
import { createNoteId } from "@/core/domain/note/valueObject";

export function useBulkExport() {
  const context = useDIContainer();
  const [exporting, setExporting] = useState(false);

  const exportNotes = useCallback(
    async (notes: Note[]) => {
      if (notes.length === 0) {
        toast.error("エクスポートするメモを選択してください");
        return;
      }

      setExporting(true);
      try {
        // Export each note as markdown
        for (const note of notes) {
          await exportNoteAsMarkdown(context, { id: createNoteId(note.id) });
        }

        toast.success(`${notes.length}件のメモをエクスポートしました`);
      } catch (error) {
        console.error("Failed to export notes:", error);
        toast.error("メモのエクスポートに失敗しました");
      } finally {
        setExporting(false);
      }
    },
    [context],
  );

  return { exporting, exportNotes };
}
