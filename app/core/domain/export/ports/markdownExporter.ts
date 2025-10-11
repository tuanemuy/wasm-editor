import type { Result } from "neverthrow";
import type { Asset } from "@/core/domain/asset/entity";
import type { Note } from "@/core/domain/note/entity";
import type { NoteId } from "@/core/domain/note/valueObject";
import type { ExternalServiceError } from "@/core/error/adapter";

/**
 * Markdown exporter interface
 */
export interface MarkdownExporter {
  /**
   * Export a single note to Markdown string
   */
  export(
    note: Note,
    assets: Asset[],
  ): Promise<Result<string, ExternalServiceError>>;

  /**
   * Export multiple notes to Markdown strings
   */
  exportMultiple(
    notes: Note[],
    assetsByNoteId: Map<NoteId, Asset[]>,
  ): Promise<Result<string[], ExternalServiceError>>;
}
