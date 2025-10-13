import type { Context } from "../context";

export async function cleanupUnusedImages(context: Context): Promise<number> {
  // Extract image IDs from all notes
  const usedImageIds = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.imageRepository.findUsedImageIds();
    },
  );

  // Get all images
  const allImages = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.imageRepository.findAll();
    },
  );

  // Find unused images
  const unusedImages = allImages.filter(
    (image) => !usedImageIds.includes(image.id),
  );

  // Delete unused images
  for (const image of unusedImages) {
    try {
      await context.imageStoragePort.deleteImage(image.storagePath);
    } catch (error) {
      // Continue if storage deletion fails
      console.error(`Failed to delete image from storage: ${image.id}`, error);
    }
  }

  // Delete metadata from database
  const deletedCount = await context.unitOfWorkProvider.run(
    async (repositories) => {
      return await repositories.imageRepository.deleteUnusedImages(
        usedImageIds,
      );
    },
  );

  return deletedCount;
}
