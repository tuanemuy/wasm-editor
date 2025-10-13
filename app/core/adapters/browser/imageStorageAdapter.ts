import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { ImageStoragePort } from "@/core/domain/image/ports/imageStoragePort";
import type { ImageId, StoragePath } from "@/core/domain/image/valueObject";

export class ImageStorageAdapter implements ImageStoragePort {
  private readonly imageDirectoryName = "images";

  async pickImage(options?: {
    accept?: string[];
    multiple?: boolean;
  }): Promise<File[]> {
    try {
      return new Promise((resolve, _reject) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = options?.accept?.join(",") || "image/*";
        input.multiple = options?.multiple || false;

        input.onchange = () => {
          if (input.files) {
            resolve(Array.from(input.files));
          } else {
            resolve([]);
          }
        };

        input.oncancel = () => {
          resolve([]);
        };

        input.click();
      });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.ImagePickerError,
        error instanceof Error ? error.message : "Failed to pick image",
      );
    }
  }

  async saveImage(id: ImageId, file: File): Promise<StoragePath> {
    try {
      const root = await navigator.storage.getDirectory();
      const imageDir = await root.getDirectoryHandle(this.imageDirectoryName, {
        create: true,
      });

      // Create a file with the image ID as filename
      const fileHandle = await imageDir.getFileHandle(id, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(file);
      await writable.close();

      return `${this.imageDirectoryName}/${id}` as StoragePath;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.ImageSaveError,
        error instanceof Error ? error.message : "Failed to save image",
      );
    }
  }

  async loadImage(storagePath: StoragePath): Promise<Blob> {
    try {
      const root = await navigator.storage.getDirectory();
      const pathParts = storagePath.split("/");

      if (pathParts.length !== 2) {
        throw new Error("Invalid storage path");
      }

      const [dirName, fileName] = pathParts;
      const imageDir = await root.getDirectoryHandle(dirName);
      const fileHandle = await imageDir.getFileHandle(fileName);
      const file = await fileHandle.getFile();

      return file;
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.ImageLoadError,
        error instanceof Error ? error.message : "Failed to load image",
      );
    }
  }

  async deleteImage(storagePath: StoragePath): Promise<void> {
    try {
      const root = await navigator.storage.getDirectory();
      const pathParts = storagePath.split("/");

      if (pathParts.length !== 2) {
        throw new Error("Invalid storage path");
      }

      const [dirName, fileName] = pathParts;
      const imageDir = await root.getDirectoryHandle(dirName);
      await imageDir.removeEntry(fileName);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.ImageDeleteError,
        error instanceof Error ? error.message : "Failed to delete image",
      );
    }
  }

  createImageUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  revokeImageUrl(url: string): void {
    URL.revokeObjectURL(url);
  }

  async initializeImageDirectory(): Promise<void> {
    try {
      const root = await navigator.storage.getDirectory();
      await root.getDirectoryHandle(this.imageDirectoryName, { create: true });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.ImageDirectoryInitError,
        error instanceof Error
          ? error.message
          : "Failed to initialize image directory",
      );
    }
  }
}

export const createImageStorageAdapter = (): ImageStoragePort => {
  return new ImageStorageAdapter();
};
