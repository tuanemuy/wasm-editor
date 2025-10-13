import type { ImageId } from "@/core/domain/image/valueObject";
import type { Context } from "../context";
import { NotFoundError, NotFoundErrorCode } from "../error";

export type DeleteImageInput = {
  id: ImageId;
};

export async function deleteImage(
  context: Context,
  input: DeleteImageInput,
): Promise<void> {
  // Get image metadata
  const image = await context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.imageRepository.findById(input.id);
  });

  if (!image) {
    throw new NotFoundError(NotFoundErrorCode.NotFound, "Image not found");
  }

  // Delete from storage
  await context.imageStoragePort.deleteImage(image.storagePath);

  // Delete metadata from database
  await context.unitOfWorkProvider.run(async (repositories) => {
    await repositories.imageRepository.delete(input.id);
  });
}
