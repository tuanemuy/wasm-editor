import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import type { AssetId } from "@/core/domain/asset/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type GetImageUrlInput = {
  id: AssetId;
};

export async function getImageUrl(
  context: Context,
  input: GetImageUrlInput,
): Promise<Result<string, ApplicationError>> {
  // Get asset
  const assetResult = await context.assetRepository.findById(input.id);

  if (assetResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to get image URL",
        assetResult.error,
      ),
    );
  }

  const asset = assetResult.value;
  if (asset === null) {
    return err(
      new ApplicationError(ApplicationErrorCode.NOT_FOUND, "Asset not found"),
    );
  }

  // Get file URL from storage
  const urlResult = await context.assetStorageManager.getUrl(asset.path);

  if (urlResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to get image URL",
        urlResult.error,
      ),
    );
  }

  return ok(urlResult.value);
}
