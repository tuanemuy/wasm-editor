import type { ImageId, StoragePath } from "../valueObject";

export interface ImageStoragePort {
  /**
   * Show file picker dialog and select images
   * @throws {SystemError}
   */
  pickImage(options?: {
    accept?: string[];
    multiple?: boolean;
  }): Promise<File[]>;

  /**
   * Save image to storage
   * @throws {SystemError}
   */
  saveImage(id: ImageId, file: File): Promise<StoragePath>;

  /**
   * Load image from storage
   * @throws {SystemError}
   */
  loadImage(storagePath: StoragePath): Promise<Blob>;

  /**
   * Delete image from storage
   * @throws {SystemError}
   */
  deleteImage(storagePath: StoragePath): Promise<void>;

  /**
   * Create image URL for display
   */
  createImageUrl(blob: Blob): string;

  /**
   * Revoke image URL
   */
  revokeImageUrl(url: string): void;

  /**
   * Initialize image directory
   * @throws {SystemError}
   */
  initializeImageDirectory(): Promise<void>;
}
