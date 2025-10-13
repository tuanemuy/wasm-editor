import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import type { Asset } from "@/core/domain/asset/entity";
import { createAsset } from "@/core/domain/asset/entity";
import {
  generateAssetId,
  type NoteId,
  type Path,
} from "@/core/domain/asset/valueObject";
import {
  ApplicationError,
  ApplicationErrorCode,
} from "@/core/error/application";
import type { Context } from "../context";

export type UploadImageInput = {
  noteId: NoteId;
  file: File;
};

/**
 * Get file extension from file name
 */
function getFileExtension(fileName: string): string {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1] : "";
}

export async function uploadImage(
  context: Context,
  input: UploadImageInput,
): Promise<Result<Asset, ApplicationError>> {
  // Validate note exists
  const noteResult = await context.noteRepository.findById(input.noteId);
  if (noteResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to upload image",
        noteResult.error,
      ),
    );
  }

  if (noteResult.value === null) {
    return err(
      new ApplicationError(ApplicationErrorCode.NOT_FOUND, "Note not found"),
    );
  }

  // Generate destination path: assets/images/${UUID}.${extension}
  const assetId = generateAssetId();
  const extension = getFileExtension(input.file.name);
  const destinationPath =
    `assets/images/${assetId}${extension ? `.${extension}` : ""}` as Path;

  // Save file to storage
  const pathResult = await context.assetStorageManager.save(
    input.file,
    destinationPath,
  );

  if (pathResult.isErr()) {
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to save file",
        pathResult.error,
      ),
    );
  }

  // Create asset entity
  const assetResult = createAsset({
    noteId: input.noteId,
    path: pathResult.value,
    fileName: input.file.name,
    fileSize: input.file.size,
    mimeType: input.file.type,
  });

  if (assetResult.isErr()) {
    // Cleanup: delete the saved file
    await context.assetStorageManager.delete(pathResult.value);
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to create asset",
        assetResult.error,
      ),
    );
  }

  // Save asset to database
  const createResult = await context.assetRepository.create(assetResult.value);

  if (createResult.isErr()) {
    // Cleanup: delete the saved file
    await context.assetStorageManager.delete(pathResult.value);
    return err(
      new ApplicationError(
        ApplicationErrorCode.INTERNAL_SERVER_ERROR,
        "Failed to upload image",
        createResult.error,
      ),
    );
  }

  return ok(createResult.value);
}
