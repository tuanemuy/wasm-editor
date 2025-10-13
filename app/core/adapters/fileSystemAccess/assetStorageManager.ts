import { err, ok, type Result } from "neverthrow";
import type { AssetStorageManager } from "@/core/domain/asset/ports/assetStorageManager";
import type { Path } from "@/core/domain/asset/valueObject";
import { ExternalServiceError } from "@/core/error/adapter";
import "./types";

/**
 * File System Access adapter for Asset operations
 * Implements AssetStorageManager using the File System Access API
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API
 */
export class AssetFileSystemManager implements AssetStorageManager {
  /**
   * @param directoryHandle - The directory handle for asset storage (typically the database directory)
   */
  constructor(private readonly directoryHandle: FileSystemDirectoryHandle) {}

  /**
   * Get or create directory handle for a given path
   * Creates nested directories as needed
   */
  private async getDirectoryForPath(
    path: Path,
  ): Promise<Result<FileSystemDirectoryHandle, ExternalServiceError>> {
    try {
      // Split path into parts (e.g., "assets/images/abc.png" -> ["assets", "images"])
      const parts = path.split("/");
      const fileName = parts.pop(); // Remove file name

      if (!fileName) {
        return err(new ExternalServiceError("Invalid path: no file name"));
      }

      // Navigate/create nested directories
      let currentDir = this.directoryHandle;
      for (const part of parts) {
        if (part) {
          currentDir = await currentDir.getDirectoryHandle(part, {
            create: true,
          });
        }
      }

      return ok(currentDir);
    } catch (error) {
      return err(
        new ExternalServiceError(
          `Failed to get directory for path: ${path}`,
          error,
        ),
      );
    }
  }

  /**
   * Save a file to the specified path
   */
  async save(
    file: File,
    destinationPath: Path,
  ): Promise<Result<Path, ExternalServiceError>> {
    try {
      const dirResult = await this.getDirectoryForPath(destinationPath);
      if (dirResult.isErr()) {
        return err(dirResult.error);
      }

      // Get file name from path
      const fileName = destinationPath.split("/").pop();
      if (!fileName) {
        return err(new ExternalServiceError("Invalid path: no file name"));
      }

      // Create/overwrite file
      const fileHandle = await dirResult.value.getFileHandle(fileName, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(file);
      await writable.close();

      return ok(destinationPath);
    } catch (error) {
      return err(
        new ExternalServiceError(
          `Failed to save file to ${destinationPath}`,
          error,
        ),
      );
    }
  }

  /**
   * Read a file from the specified path
   */
  async read(path: Path): Promise<Result<File, ExternalServiceError>> {
    try {
      const dirResult = await this.getDirectoryForPath(path);
      if (dirResult.isErr()) {
        return err(dirResult.error);
      }

      // Get file name from path
      const fileName = path.split("/").pop();
      if (!fileName) {
        return err(new ExternalServiceError("Invalid path: no file name"));
      }

      // Read file
      const fileHandle = await dirResult.value.getFileHandle(fileName);
      const file = await fileHandle.getFile();

      return ok(file);
    } catch (error) {
      return err(
        new ExternalServiceError(`Failed to read file from ${path}`, error),
      );
    }
  }

  /**
   * Delete a file at the specified path
   */
  async delete(path: Path): Promise<Result<void, ExternalServiceError>> {
    try {
      const dirResult = await this.getDirectoryForPath(path);
      if (dirResult.isErr()) {
        return err(dirResult.error);
      }

      // Get file name from path
      const fileName = path.split("/").pop();
      if (!fileName) {
        return err(new ExternalServiceError("Invalid path: no file name"));
      }

      // Delete file
      await dirResult.value.removeEntry(fileName);

      return ok(undefined);
    } catch (error) {
      return err(
        new ExternalServiceError(`Failed to delete file at ${path}`, error),
      );
    }
  }

  /**
   * Get a data URL for displaying in the browser
   */
  async getUrl(path: Path): Promise<Result<string, ExternalServiceError>> {
    try {
      const fileResult = await this.read(path);
      if (fileResult.isErr()) {
        return err(fileResult.error);
      }

      // Create Blob URL
      const url = URL.createObjectURL(fileResult.value);

      return ok(url);
    } catch (error) {
      return err(
        new ExternalServiceError(`Failed to get URL for ${path}`, error),
      );
    }
  }
}
