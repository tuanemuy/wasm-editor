import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { FileSystemAccessPort } from "@/core/domain/database/ports/fileSystemAccessPort";

export class FileSystemAccessAdapter implements FileSystemAccessPort {
  async openFilePicker(options?: {
    accept?: { [key: string]: string[] };
    suggestedName?: string;
  }): Promise<FileSystemFileHandle> {
    try {
      if (!("showOpenFilePicker" in window)) {
        throw new SystemError(
          SystemErrorCode.FileSystemNotSupported,
          "File System Access API is not supported",
        );
      }

      // biome-ignore lint/suspicious/noExplicitAny: File System Access API types are not fully available
      const [handle] = await (window as any).showOpenFilePicker({
        types: options?.accept
          ? [
              {
                description: "Database files",
                accept: options.accept,
              },
            ]
          : undefined,
      });
      return handle;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new SystemError(
          SystemErrorCode.FilePickerCancelled,
          "File picker was cancelled",
        );
      }
      throw new SystemError(
        SystemErrorCode.FilePickerError,
        error instanceof Error ? error.message : "Failed to open file picker",
      );
    }
  }

  async saveFilePicker(options?: {
    suggestedName?: string;
    types?: { description: string; accept: { [key: string]: string[] } }[];
  }): Promise<FileSystemFileHandle> {
    try {
      if (!("showSaveFilePicker" in window)) {
        throw new SystemError(
          SystemErrorCode.FileSystemNotSupported,
          "File System Access API is not supported",
        );
      }

      // biome-ignore lint/suspicious/noExplicitAny: File System Access API types are not fully available
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: options?.suggestedName,
        types: options?.types,
      });
      return handle;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new SystemError(
          SystemErrorCode.FilePickerCancelled,
          "File picker was cancelled",
        );
      }
      throw new SystemError(
        SystemErrorCode.FilePickerError,
        error instanceof Error
          ? error.message
          : "Failed to open save file picker",
      );
    }
  }

  async readFile(handle: FileSystemFileHandle): Promise<ArrayBuffer> {
    try {
      const file = await handle.getFile();
      return await file.arrayBuffer();
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.FileReadError,
        error instanceof Error ? error.message : "Failed to read file",
      );
    }
  }

  async writeFile(
    handle: FileSystemFileHandle,
    data: ArrayBuffer,
  ): Promise<void> {
    try {
      const writable = await handle.createWritable();
      await writable.write(data);
      await writable.close();
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.FileWriteError,
        error instanceof Error ? error.message : "Failed to write file",
      );
    }
  }

  async verifyPermission(
    handle: FileSystemFileHandle,
    mode: "read" | "readwrite",
  ): Promise<boolean> {
    try {
      const opts = { mode };

      // Check if we already have permission
      // biome-ignore lint/suspicious/noExplicitAny: queryPermission is not in TypeScript types yet
      if ((await (handle as any).queryPermission(opts)) === "granted") {
        return true;
      }

      // Request permission
      // biome-ignore lint/suspicious/noExplicitAny: requestPermission is not in TypeScript types yet
      if ((await (handle as any).requestPermission(opts)) === "granted") {
        return true;
      }

      return false;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.PermissionError,
        error instanceof Error ? error.message : "Failed to verify permission",
      );
    }
  }

  getFileName(handle: FileSystemFileHandle): string {
    return handle.name;
  }

  async getFilePath(handle: FileSystemFileHandle): Promise<string | null> {
    try {
      // File System Access API doesn't provide a stable file path
      // We can only return the file name
      return handle.name;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.FilePathError,
        error instanceof Error ? error.message : "Failed to get file path",
      );
    }
  }
}

export const createFileSystemAccessAdapter = (): FileSystemAccessPort => {
  return new FileSystemAccessAdapter();
};
