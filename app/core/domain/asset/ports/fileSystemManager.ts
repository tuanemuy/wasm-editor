import type { Result } from "neverthrow";
import type { ExternalServiceError } from "@/core/error/adapter";
import type { FilePath } from "../valueObject";

/**
 * File system manager interface
 * Uses File System Access API for browser-based file operations
 */
export interface FileSystemManager {
  /**
   * Save a file to the file system
   */
  saveFile(
    file: File,
    destinationPath: FilePath,
  ): Promise<Result<FilePath, ExternalServiceError>>;

  /**
   * Read a file from the file system
   */
  readFile(filePath: FilePath): Promise<Result<File, ExternalServiceError>>;

  /**
   * Delete a file from the file system
   */
  deleteFile(filePath: FilePath): Promise<Result<void, ExternalServiceError>>;

  /**
   * Get a file URL (Blob URL) for displaying in the browser
   */
  getFileUrl(filePath: FilePath): Promise<Result<string, ExternalServiceError>>;
}
