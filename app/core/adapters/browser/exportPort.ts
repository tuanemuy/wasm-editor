/**
 * Browser Export Port Adapter
 *
 * Implements ExportPort using browser File System Access API.
 * Exports notes as Markdown files and ZIP archives.
 */
import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Note } from "@/core/domain/note/entity";
import type {
  ExportedFile,
  ExportPort,
} from "@/core/domain/note/ports/exportPort";

export class BrowserExportPort implements ExportPort {
  /**
   * Extract title from note content (first line or first heading)
   */
  private extractTitle(content: string): string {
    // Try to extract first heading (# Title)
    const headingMatch = content.match(/^#\s+(.+)$/m);
    if (headingMatch) {
      return headingMatch[1].trim();
    }

    // Otherwise, use first non-empty line
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 0) {
        // Remove markdown formatting and limit length
        const cleaned = trimmed
          .replace(/[#*_`]/g, "")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          .trim();
        return cleaned.substring(0, 50);
      }
    }

    return "Untitled";
  }

  /**
   * Sanitize filename for file system
   */
  private sanitizeFilename(name: string): string {
    return name
      .replace(/[/\\?%*:|"<>]/g, "-")
      .replace(/\s+/g, "_")
      .trim();
  }

  /**
   * Generate filename from note
   */
  private generateFilename(note: Note): string {
    const title = this.extractTitle(note.content);
    const sanitized = this.sanitizeFilename(title);

    if (sanitized.length > 0) {
      return `${sanitized}.md`;
    }

    // Fallback to date-based filename
    const dateStr = note.createdAt.toISOString().split("T")[0];
    return `note_${dateStr}.md`;
  }

  async exportAsMarkdown(note: Note): Promise<ExportedFile> {
    try {
      const filename = this.generateFilename(note);
      const content = note.content;

      return {
        filename,
        content,
      };
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.ExportError,
        "Failed to export note as markdown",
        error,
      );
    }
  }

  async exportMultipleAsMarkdown(_notes: Note[]): Promise<Blob> {
    try {
      // For now, we'll throw an error since this requires JSZip library
      // This will be implemented when ZIP export feature is needed
      throw new Error("ZIP export not yet implemented");
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.ExportError,
        "Failed to export notes as ZIP",
        error,
      );
    }
  }
}
