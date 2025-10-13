import { err, ok, type Result } from "neverthrow";
import type { Tag } from "@/core/domain/note/entity";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export async function getTags(
  context: Context,
): Promise<Result<Tag[], ApplicationError>> {
  const result = await context.tagRepository.findAll();

  if (result.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to get tags",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
