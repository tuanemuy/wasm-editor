import type { Result } from "neverthrow";
import type { ExternalServiceError } from "@/core/error/adapter";

/**
 * File system manager interface for database operations
 * Uses File System Access API
 */
export interface FileSystemManager {
  /**
   * Open a file picker dialog and return the selected file
   */
  openFileWithDialog(): Promise<Result<File, ExternalServiceError>>;

  /**
   * Open a save file dialog and save the file
   */
  saveFileWithDialog(
    file: File,
    suggestedName: string,
  ): Promise<Result<string, ExternalServiceError>>;
}
