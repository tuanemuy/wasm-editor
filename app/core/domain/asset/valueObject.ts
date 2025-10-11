import { v7 as uuidv7 } from "uuid";
import * as z from "zod";

/**
 * Asset ID (UUID v7)
 */
export const assetIdSchema = z.string().uuid().brand<"AssetId">();
export type AssetId = z.infer<typeof assetIdSchema>;

export function generateAssetId(): AssetId {
  return uuidv7() as AssetId;
}

/**
 * Note ID (referenced from Note domain)
 */
export const noteIdSchema = z.string().uuid().brand<"NoteId">();
export type NoteId = z.infer<typeof noteIdSchema>;

/**
 * File path (relative path from file system root)
 */
export const filePathSchema = z.string().min(1);
export type FilePath = z.infer<typeof filePathSchema>;

/**
 * File name
 */
export const fileNameSchema = z.string().min(1).max(255);
export type FileName = z.infer<typeof fileNameSchema>;

/**
 * File size limit (10MB in bytes)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Supported image MIME types
 */
export const SUPPORTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
] as const;
