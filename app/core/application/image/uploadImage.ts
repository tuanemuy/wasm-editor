import type { Image } from "@/core/domain/image/entity";
import { createImage } from "@/core/domain/image/entity";
import type { Context } from "../context";
import { ValidationError, ValidationErrorCode } from "../error";

export type UploadImageInput = {
  file?: File;
};

export async function uploadImage(
  context: Context,
  input: UploadImageInput = {},
): Promise<Image> {
  let file = input.file;

  // Pick image if not provided
  if (!file) {
    const files = await context.imageStoragePort.pickImage({
      accept: ["image/jpeg", "image/png", "image/gif", "image/webp"],
      multiple: false,
    });
    if (files.length === 0) {
      throw new ValidationError(
        ValidationErrorCode.InvalidInput,
        "No file selected",
      );
    }
    file = files[0];
  }

  // Validate MIME type
  const validMimeTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!validMimeTypes.includes(file.type)) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      `Invalid MIME type: ${file.type}`,
    );
  }

  // Validate file size (10MB max)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    throw new ValidationError(
      ValidationErrorCode.InvalidInput,
      `File size exceeds maximum: ${maxSize} bytes`,
    );
  }

  // Get image dimensions
  const dimensions = await context.imageProcessingPort.getImageDimensions(file);

  // Optimize image (optional)
  const optimizedBlob = await context.imageProcessingPort.optimizeImage(
    file,
    0.85,
  );
  const optimizedFile = new File([optimizedBlob], file.name, {
    type: file.type,
  });

  // Generate image ID first
  const { generateImageId } = await import("@/core/domain/image/valueObject");
  const imageId = generateImageId();

  // Save to storage
  const storagePath = await context.imageStoragePort.saveImage(
    imageId,
    optimizedFile,
  );

  // Create image entity
  const image = createImage({
    fileName: file.name,
    mimeType: file.type,
    size: optimizedFile.size,
    width: dimensions.width,
    height: dimensions.height,
    storagePath,
  });

  // Save metadata to database
  const savedImage = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.imageRepository.create({
        ...image,
        storagePath,
      });
    },
  );

  return savedImage;
}
