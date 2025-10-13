import type { ImageId } from "@/core/domain/image/valueObject";
import type { Context } from "../context";
import { NotFoundError, NotFoundErrorCode } from "../error";

export type GetImageUrlInput = {
  id: ImageId;
};

export async function getImageUrl(
  context: Context,
  input: GetImageUrlInput,
): Promise<string> {
  // Get image metadata
  const image = await context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.imageRepository.findById(input.id);
  });

  if (!image) {
    throw new NotFoundError(NotFoundErrorCode.NotFound, "Image not found");
  }

  // Load image from storage
  const blob = await context.imageStoragePort.loadImage(image.storagePath);

  // Create blob URL
  const url = context.imageStoragePort.createImageUrl(blob);

  return url;
}
