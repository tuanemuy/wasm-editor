import type { Result } from "neverthrow";
import type { FilePath } from "@/core/domain/asset/valueObject";
import type { ExternalServiceError } from "@/core/error/adapter";

/**
 * File system manager interface for export operations
 * Uses File System Access API
 */
export interface FileSystemManager {
  /**
   * Save a file to the specified path
   */
  saveFile(
    file: File,
    destinationPath: FilePath,
  ): Promise<Result<FilePath, ExternalServiceError>>;

  /**
   * Open a save file dialog and save the file
   */
  saveFileWithDialog(
    file: File,
    suggestedName: string,
  ): Promise<Result<FilePath, ExternalServiceError>>;
}
