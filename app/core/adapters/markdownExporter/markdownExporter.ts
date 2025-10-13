import { err, ok, type Result } from "neverthrow";
import type { Asset } from "@/core/domain/asset/entity";
import type { MarkdownExporter as IMarkdownExporter } from "@/core/domain/export/ports/markdownExporter";
import type { Note } from "@/core/domain/note/entity";
import type { NoteId } from "@/core/domain/note/valueObject";
import { ExternalServiceError } from "@/core/error/adapter";

export class MarkdownExporter implements IMarkdownExporter {
  async export(
    note: Note,
    assets: Asset[],
  ): Promise<Result<string, ExternalServiceError>> {
    try {
      // Convert note content to markdown
      let markdown = note.content;

      // Add metadata as frontmatter if tags exist
      if (note.tags.length > 0) {
        const frontmatter = [
          "---",
          `tags: [${note.tags.join(", ")}]`,
          `created: ${note.createdAt.toISOString()}`,
          `updated: ${note.updatedAt.toISOString()}`,
          "---",
          "",
        ].join("\n");
        markdown = frontmatter + markdown;
      }

      // Process asset references in markdown
      // Replace asset references with proper markdown image syntax
      for (const asset of assets) {
        // This is a simple implementation - you may need to adjust based on how assets are referenced
        const assetRef = `![${asset.fileName}](${asset.path})`;
        // Note: In a real implementation, you might want to embed base64 images or copy assets
        markdown = markdown.replace(
          new RegExp(`\\[${asset.fileName}\\]`, "g"),
          assetRef,
        );
      }

      return ok(markdown);
    } catch (error) {
      return err(
        new ExternalServiceError("Failed to export to Markdown", error),
      );
    }
  }

  async exportMultiple(
    notes: Note[],
    assetsByNoteId: Map<NoteId, Asset[]>,
  ): Promise<Result<string[], ExternalServiceError>> {
    try {
      const results: string[] = [];

      for (const note of notes) {
        const assets = assetsByNoteId.get(note.id) ?? [];
        const result = await this.export(note, assets);

        if (result.isErr()) {
          return err(result.error);
        }

        results.push(result.value);
      }

      return ok(results);
    } catch (error) {
      return err(
        new ExternalServiceError(
          "Failed to export multiple notes to Markdown",
          error,
        ),
      );
    }
  }
}
