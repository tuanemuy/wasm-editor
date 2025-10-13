import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { Note } from "@/core/domain/note/entity";
import type { ExportPort } from "@/core/domain/note/ports/exportPort";

export class ExportAdapter implements ExportPort {
  async exportAsMarkdown(note: Note, fileName: string): Promise<void> {
    try {
      if (!("showSaveFilePicker" in window)) {
        // Fallback to download
        this.downloadAsMarkdown(note, fileName);
        return;
      }

      // biome-ignore lint/suspicious/noExplicitAny: File System Access API types are not fully available
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName.endsWith(".md") ? fileName : `${fileName}.md`,
        types: [
          {
            description: "Markdown files",
            accept: { "text/markdown": [".md"] },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(note.body);
      await writable.close();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // User cancelled, not an error
        return;
      }
      throw new SystemError(
        SystemErrorCode.ExportError,
        error instanceof Error ? error.message : "Failed to export note",
      );
    }
  }

  async exportMultipleAsMarkdown(
    notes: Note[],
    directoryName: string,
  ): Promise<void> {
    try {
      if (!("showDirectoryPicker" in window)) {
        // Fallback to download as zip
        await this.downloadMultipleAsZip(notes, directoryName);
        return;
      }

      // biome-ignore lint/suspicious/noExplicitAny: File System Access API types are not fully available
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: "readwrite",
      });

      for (const note of notes) {
        const fileName = this.sanitizeFileName(this.getNoteTitle(note));
        const fileHandle = await dirHandle.getFileHandle(`${fileName}.md`, {
          create: true,
        });
        const writable = await fileHandle.createWritable();
        await writable.write(note.body);
        await writable.close();
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        // User cancelled, not an error
        return;
      }
      throw new SystemError(
        SystemErrorCode.ExportError,
        error instanceof Error ? error.message : "Failed to export notes",
      );
    }
  }

  private downloadAsMarkdown(note: Note, fileName: string): void {
    const blob = new Blob([note.body], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName.endsWith(".md") ? fileName : `${fileName}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private async downloadMultipleAsZip(
    notes: Note[],
    _directoryName: string,
  ): Promise<void> {
    // Simple fallback: download each file separately
    for (const note of notes) {
      const fileName = this.sanitizeFileName(this.getNoteTitle(note));
      this.downloadAsMarkdown(note, fileName);
    }
  }

  private getNoteTitle(note: Note): string {
    // Extract title from first line of the note body
    const firstLine = note.body.split("\n")[0];
    if (firstLine?.trim()) {
      // Remove markdown heading syntax if present
      return firstLine.replace(/^#+ /, "").trim();
    }
    return "untitled";
  }

  private sanitizeFileName(fileName: string): string {
    // Remove invalid characters for file names
    // biome-ignore lint/suspicious/noControlCharactersInRegex: Control characters are intentionally excluded from file names
    return fileName.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").slice(0, 255);
  }
}

export const createExportAdapter = (): ExportPort => {
  return new ExportAdapter();
};
