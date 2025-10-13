import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import type { AssetId } from "@/core/domain/asset/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type DeleteAssetInput = {
  id: AssetId;
};

export async function deleteAsset(
  context: Context,
  input: DeleteAssetInput,
): Promise<Result<void, ApplicationError>> {
  // Get asset to find file path
  const assetResult = await context.assetRepository.findById(input.id);

  if (assetResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to delete asset",
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

  // Delete file from storage
  const deleteFileResult = await context.assetStorageManager.delete(asset.path);

  if (deleteFileResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to delete file",
        deleteFileResult.error,
      ),
    );
  }

  // Delete asset from database
  const deleteResult = await context.assetRepository.delete(input.id);

  if (deleteResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to delete asset",
        deleteResult.error,
      ),
    );
  }

  return ok(deleteResult.value);
}
