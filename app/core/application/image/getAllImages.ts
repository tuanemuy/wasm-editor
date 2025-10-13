import type { Image } from "@/core/domain/image/entity";
import type { Context } from "../context";

export async function getAllImages(context: Context): Promise<Image[]> {
  const images = await context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.imageRepository.findAll();
  });

  return images;
}
