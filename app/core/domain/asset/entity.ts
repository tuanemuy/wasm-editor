import { err, type Result } from "neverthrow";
import * as z from "zod";
import { ValidationError, validate } from "@/lib/validation";
import {
  type AssetId,
  assetIdSchema,
  type FileName,
  fileNameSchema,
  generateAssetId,
  MAX_FILE_SIZE,
  type NoteId,
  noteIdSchema,
  type Path,
  pathSchema,
  SUPPORTED_IMAGE_TYPES,
} from "./valueObject";

/**
 * Asset entity
 */
export type Asset = Readonly<{
  id: AssetId;
  noteId: NoteId;
  path: Path;
  fileName: FileName;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
}>;

/**
 * Parameters for creating a new asset
 */
export type CreateAssetParams = {
  noteId: NoteId;
  path: Path;
  fileName: FileName;
  fileSize: number;
  mimeType: string;
};

/**
 * Raw asset data from database
 */
export type RawAssetData = {
  id: string;
  noteId: string;
  path: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  createdAt: Date;
};

/**
 * Create a new asset
 */
export function createAsset(
  params: CreateAssetParams,
): Result<Asset, ValidationError> {
  // Validate file size
  if (params.fileSize > MAX_FILE_SIZE) {
    return err(
      new ValidationError(
        {} as z.ZodError,
        `File size exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`,
      ),
    );
  }

  // Validate MIME type
  if (!SUPPORTED_IMAGE_TYPES.includes(params.mimeType as never)) {
    return err(
      new ValidationError(
        {} as z.ZodError,
        `Unsupported file type: ${params.mimeType}`,
      ),
    );
  }

  return validate(
    z.object({
      noteId: noteIdSchema,
      path: pathSchema,
      fileName: fileNameSchema,
      fileSize: z.number().int().positive(),
      mimeType: z.string(),
    }),
    params,
  ).map((validated) => {
    return {
      id: generateAssetId(),
      noteId: validated.noteId,
      path: validated.path,
      fileName: validated.fileName,
      fileSize: validated.fileSize,
      mimeType: validated.mimeType,
      createdAt: new Date(),
    } satisfies Asset;
  });
}

/**
 * Reconstruct asset from raw data
 */
export function reconstructAsset(
  data: RawAssetData,
): Result<Asset, ValidationError> {
  return validate(
    z.object({
      id: assetIdSchema,
      noteId: noteIdSchema,
      path: pathSchema,
      fileName: fileNameSchema,
      fileSize: z.number().int().positive(),
      mimeType: z.string(),
      createdAt: z.date(),
    }),
    data,
  );
}
