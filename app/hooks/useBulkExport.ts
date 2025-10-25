import { useCallback, useState } from "react";
import { toast } from "sonner";
import { withContainer } from "@/di";
import { exportNoteAsMarkdown as exportNoteAsMarkdownService } from "@/core/application/note/exportNoteAsMarkdown";
import type { Note } from "@/core/domain/note/entity";
import { createNoteId } from "@/core/domain/note/valueObject";
import { request } from "@/presenters/request";

const exportNoteAsMarkdown = withContainer(exportNoteAsMarkdownService);

export function useBulkExport() {
  const [exporting, setExporting] = useState(false);

  const exportNotes = useCallback(async (notes: Note[]) => {
    if (notes.length === 0) {
      toast.error("エクスポートするメモを選択してください");
      return;
    }

    setExporting(true);

    let successCount = 0;
    const errors: Array<{ note: Note; error: unknown }> = [];

    try {
      // Export each note as markdown
      for (const note of notes) {
        try {
          await request(exportNoteAsMarkdown({ id: createNoteId(note.id) }));
          successCount++;
        } catch (error) {
          console.error("Failed to export note:", error);
          errors.push({ note, error });
          // Continue with remaining notes instead of stopping
        }
      }

      // Report results
      if (errors.length === 0) {
        toast.success(`${notes.length}件のメモをエクスポートしました`);
      } else if (successCount > 0) {
        toast.warning(
          `${successCount}/${notes.length}件のメモをエクスポートしました（${errors.length}件失敗）`,
        );
      } else {
        toast.error("メモのエクスポートに失敗しました");
      }
    } finally {
      setExporting(false);
    }
  }, []);

  return { exporting, exportNotes };
}
