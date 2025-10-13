import { err, ok, type Result } from "neverthrow";
import type { Asset } from "@/core/domain/asset/entity";
import type { AssetId } from "@/core/domain/asset/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type GetAssetInput = {
  id: AssetId;
};

export async function getAsset(
  context: Context,
  input: GetAssetInput,
): Promise<Result<Asset | null, ApplicationError>> {
  const result = await context.assetRepository.findById(input.id);

  if (result.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to get asset",
        result.error,
      ),
    );
  }

  return ok(result.value);
}
