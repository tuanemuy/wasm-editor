import type { ImageId } from "@/core/domain/image/valueObject";
import type { Context } from "../context";
import { NotFoundError, NotFoundErrorCode } from "../error";

export type GetImageMarkdownInput = {
  id: ImageId;
  alt?: string;
};

export async function getImageMarkdown(
  context: Context,
  input: GetImageMarkdownInput,
): Promise<string> {
  // Get image metadata to verify it exists
  const image = await context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.imageRepository.findById(input.id);
  });

  if (!image) {
    throw new NotFoundError(NotFoundErrorCode.NotFound, "Image not found");
  }

  // Generate markdown
  const alt = input.alt || image.fileName;
  const markdown = `![${alt}](image://${input.id})`;

  return markdown;
}
