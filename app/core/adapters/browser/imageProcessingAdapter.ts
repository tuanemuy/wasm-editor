import { SystemError, SystemErrorCode } from "@/core/application/error";
import type { ImageProcessingPort } from "@/core/domain/image/ports/imageProcessingPort";

export class ImageProcessingAdapter implements ImageProcessingPort {
  async getImageDimensions(
    file: File,
  ): Promise<{ width: number; height: number }> {
    try {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve({ width: img.width, height: img.height });
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error("Failed to load image"));
        };

        img.src = url;
      });
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.ImageDimensionsError,
        error instanceof Error
          ? error.message
          : "Failed to get image dimensions",
      );
    }
  }

  async resizeImage(
    file: File,
    maxWidth: number,
    maxHeight: number,
  ): Promise<Blob> {
    try {
      const dimensions = await this.getImageDimensions(file);
      let { width, height } = dimensions;

      // Calculate new dimensions while maintaining aspect ratio
      if (width > maxWidth || height > maxHeight) {
        const aspectRatio = width / height;

        if (width > height) {
          width = maxWidth;
          height = Math.round(maxWidth / aspectRatio);
        } else {
          height = maxHeight;
          width = Math.round(maxHeight * aspectRatio);
        }
      } else {
        // No resize needed, return original
        return file;
      }

      return this.processImage(file, width, height, 0.9);
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.ImageResizeError,
        error instanceof Error ? error.message : "Failed to resize image",
      );
    }
  }

  async optimizeImage(file: File, quality: number): Promise<Blob> {
    try {
      const dimensions = await this.getImageDimensions(file);
      return this.processImage(
        file,
        dimensions.width,
        dimensions.height,
        quality,
      );
    } catch (error) {
      throw new SystemError(
        SystemErrorCode.ImageOptimizeError,
        error instanceof Error ? error.message : "Failed to optimize image",
      );
    }
  }

  private async processImage(
    file: File,
    width: number,
    height: number,
    quality: number,
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to create blob"));
            }
          },
          file.type || "image/png",
          quality,
        );
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };

      img.src = url;
    });
  }
}

export const createImageProcessingAdapter = (): ImageProcessingPort => {
  return new ImageProcessingAdapter();
};
