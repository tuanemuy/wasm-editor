import type { Result } from "neverthrow";
import type { Asset } from "@/core/domain/asset/entity";
import type { Note } from "@/core/domain/note/entity";
import type { NoteId } from "@/core/domain/note/valueObject";
import type { ExternalServiceError } from "@/core/error/adapter";

/**
 * PDF exporter interface
 */
export interface PdfExporter {
  /**
   * Export a single note to PDF (Blob)
   */
  export(
    note: Note,
    assets: Asset[],
  ): Promise<Result<Blob, ExternalServiceError>>;

  /**
   * Export multiple notes to PDF files (Blob array)
   */
  exportMultiple(
    notes: Note[],
    assetsByNoteId: Map<NoteId, Asset[]>,
  ): Promise<Result<Blob[], ExternalServiceError>>;
}
