import { err, ok, type Result } from "neverthrow";
import type { DatabaseStorageManager } from "@/core/domain/database/ports/databaseStorageManager";
import { ExternalServiceError } from "@/core/error/adapter";
import "./types";

/**
 * File System Access adapter for Database operations
 * Implements DatabaseStorageManager using the File System Access API
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 */
export class DatabaseFileSystemManager implements DatabaseStorageManager {
  async openWithDialog(): Promise<Result<File, ExternalServiceError>> {
    try {
      // Check if File System Access API is available
      if ("showOpenFilePicker" in window && window.showOpenFilePicker) {
        try {
          const [fileHandle] = await window.showOpenFilePicker({
            types: [
              {
                description: "SQLite Database Files",
                accept: {
                  "application/x-sqlite3": [".db", ".sqlite", ".sqlite3"],
                },
              },
            ],
            multiple: false,
          });

          const file = await fileHandle.getFile();
          return ok(file);
        } catch (error) {
          // User cancelled or error occurred
          if ((error as Error).name === "AbortError") {
            return err(
              new ExternalServiceError("User cancelled file selection"),
            );
          }
          throw error;
        }
      }

      // Fallback: use file input element
      return err(
        new ExternalServiceError(
          "File System Access API not available in this browser",
        ),
      );
    } catch (error) {
      return err(new ExternalServiceError("Failed to open file dialog", error));
    }
  }

  async saveWithDialog(
    file: File,
    suggestedName: string,
  ): Promise<Result<string, ExternalServiceError>> {
    try {
      // Check if File System Access API is available
      if ("showSaveFilePicker" in window && window.showSaveFilePicker) {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName,
            types: [
              {
                description: "SQLite Database Files",
                accept: {
                  "application/x-sqlite3": [".db", ".sqlite", ".sqlite3"],
                },
              },
            ],
          });

          const writable = await handle.createWritable();
          await writable.write(file);
          await writable.close();

          return ok(handle.name);
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

      return ok(suggestedName);
    } catch (error) {
      return err(
        new ExternalServiceError("Failed to save file with dialog", error),
      );
    }
  }
}
