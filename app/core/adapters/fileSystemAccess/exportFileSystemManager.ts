import { err, ok, type Result } from "neverthrow";
import type { Path } from "@/core/domain/asset/valueObject";
import type { ExportStorageManager } from "@/core/domain/export/ports/exportStorageManager";
import { ExternalServiceError } from "@/core/error/adapter";
import "./types";

/**
 * File System Access adapter for Export operations
 * Implements ExportStorageManager using the File System Access API
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 */
export class ExportFileSystemManager implements ExportStorageManager {
  async save(
    file: File,
    destinationPath: Path,
  ): Promise<Result<Path, ExternalServiceError>> {
    try {
      // Note: This is a simplified implementation
      // In a real browser environment with File System Access API:
      // 1. Get directory handle
      // 2. Get file handle
      // 3. Write file contents

      // For now, this will trigger a download
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = destinationPath;
      a.click();
      URL.revokeObjectURL(url);

      return ok(destinationPath);
    } catch (error) {
      return err(new ExternalServiceError("Failed to save file", error));
    }
  }

  async saveWithDialog(
    file: File,
    suggestedName: string,
  ): Promise<Result<Path, ExternalServiceError>> {
    try {
      // Check if File System Access API is available
      if ("showSaveFilePicker" in window && window.showSaveFilePicker) {
        try {
          // Use File System Access API
          const handle = await window.showSaveFilePicker({
            suggestedName,
            types: [
              {
                description:
                  file.type === "application/pdf"
                    ? "PDF Files"
                    : "Markdown Files",
                accept: {
                  [file.type]: [
                    file.type === "application/pdf" ? ".pdf" : ".md",
                  ],
                },
              },
            ],
          });

          const writable = await handle.createWritable();
          await writable.write(file);
          await writable.close();

          return ok(handle.name as Path);
        } catch (error) {
          // User cancelled or error occurred
          if ((error as Error).name === "AbortError") {
            return err(new ExternalServiceError("User cancelled file save"));
          }
          throw error;
        }
      }

      // Fallback: trigger download
      const url = URL.createObjectURL(file);
      const a = document.createElement("a");
      a.href = url;
      a.download = suggestedName;
      a.click();
      URL.revokeObjectURL(url);

      return ok(suggestedName as Path);
    } catch (error) {
      return err(
        new ExternalServiceError("Failed to save file with dialog", error),
      );
    }
  }
}
