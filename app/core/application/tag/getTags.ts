import type { Tag } from "@/core/domain/tag/entity";
import type { Context } from "../context";

export async function getTags(context: Context): Promise<Tag[]> {
  const tags = await context.unitOfWorkProvider.run(async (repositories) => {
    return await repositories.tagRepository.findAll();
  });

  return tags;
}
