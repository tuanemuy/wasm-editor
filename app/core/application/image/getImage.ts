import type { Image } from "@/core/domain/image/entity";
import type { ImageId } from "@/core/domain/image/valueObject";
import type { Context } from "../context";
import { NotFoundError, NotFoundErrorCode } from "../error";

export type GetImageInput = {
  id: ImageId;
};

export async function getImage(
  context: Context,
  input: GetImageInput,
): Promise<Image> {
  const image = await context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.imageRepository.findById(input.id);
  });

  if (!image) {
    throw new NotFoundError(NotFoundErrorCode.NotFound, "Image not found");
  }

  return image;
}
