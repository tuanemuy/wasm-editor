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

    try {
      // Export each note as markdown
      for (const note of notes) {
        await request(exportNoteAsMarkdown({ id: createNoteId(note.id) }), {
          onError(error) {
            console.error("Failed to export note:", error);
            throw error;
          },
        });
      }

      toast.success(`${notes.length}件のメモをエクスポートしました`);
    } catch (error) {
      console.error("Failed to export notes:", error);
      toast.error("メモのエクスポートに失敗しました");
    } finally {
      setExporting(false);
    }
  }, []);

  return { exporting, exportNotes };
}
