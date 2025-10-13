import { err, ok, type Result } from "neverthrow";
import type { Asset } from "@/core/domain/asset/entity";
import type { MarkdownExporter } from "@/core/domain/export/ports/markdownExporter";
import type { Note } from "@/core/domain/note/entity";
import type { NoteId } from "@/core/domain/note/valueObject";
import { ExternalServiceError } from "@/core/error/adapter";

/**
 * Mock markdown exporter for testing
 */
export class MockMarkdownExporter implements MarkdownExporter {
  private shouldFailExport = false;
  private shouldFailExportMultiple = false;

  /**
   * Set whether export should fail
   */
  setShouldFailExport(shouldFail: boolean): void {
    this.shouldFailExport = shouldFail;
  }

  /**
   * Set whether exportMultiple should fail
   */
  setShouldFailExportMultiple(shouldFail: boolean): void {
    this.shouldFailExportMultiple = shouldFail;
  }

  /**
   * Export a single note to Markdown string
   */
  async export(
    note: Note,
    assets: Asset[],
  ): Promise<Result<string, ExternalServiceError>> {
    if (this.shouldFailExport) {
      return err(new ExternalServiceError("Mock export error"));
    }

    // Simple markdown export for testing
    let markdown = note.content;

    // Add asset references if any
    if (assets.length > 0) {
      markdown += "\n\n";
      for (const asset of assets) {
        markdown += `![${asset.fileName}](${asset.path})\n`;
      }
    }

    return ok(markdown);
  }

  /**
   * Export multiple notes to Markdown strings
   */
  async exportMultiple(
    notes: Note[],
    assetsByNoteId: Map<NoteId, Asset[]>,
  ): Promise<Result<string[], ExternalServiceError>> {
    if (this.shouldFailExportMultiple) {
      return err(new ExternalServiceError("Mock export multiple error"));
    }

    const results: string[] = [];

    for (const note of notes) {
      const assets = assetsByNoteId.get(note.id) ?? [];
      const exportResult = await this.export(note, assets);

      if (exportResult.isErr()) {
        return err(exportResult.error);
      }

      results.push(exportResult.value);
    }

    return ok(results);
  }

  /**
   * Reset the exporter state
   */
  reset(): void {
    this.shouldFailExport = false;
    this.shouldFailExportMultiple = false;
  }
}
