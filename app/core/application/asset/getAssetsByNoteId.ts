import { err, ok, type Result } from "neverthrow";
import type { Asset } from "@/core/domain/asset/entity";
import type { NoteId } from "@/core/domain/asset/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type GetAssetsByNoteIdInput = {
  noteId: NoteId;
};

export async function getAssetsByNoteId(
  context: Context,
  input: GetAssetsByNoteIdInput,
): Promise<Result<Asset[], ApplicationError>> {
  const result = await context.assetRepository.findByNoteId(input.noteId);

  if (result.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to get assets",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
