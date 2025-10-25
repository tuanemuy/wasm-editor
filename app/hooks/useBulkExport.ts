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
    let failureCount = 0;

    // Export each note as markdown
    for (const note of notes) {
      const result = await request(
        exportNoteAsMarkdown({ id: createNoteId(note.id) }),
        {
          onError: (error) => {
            console.error("Failed to export note:", error);
            failureCount++;
          },
        },
      );

      if (result) {
        successCount++;
      }
    }

    // Report results
    if (failureCount === 0) {
      toast.success(`${notes.length}件のメモをエクスポートしました`);
    } else if (successCount > 0) {
      toast.warning(
        `${successCount}/${notes.length}件のメモをエクスポートしました（${failureCount}件失敗）`,
      );
    } else {
      toast.error("メモのエクスポートに失敗しました");
    }

    setExporting(false);
  }, []);

  return { exporting, exportNotes };
}
