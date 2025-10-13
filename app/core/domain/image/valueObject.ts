import { v4 as uuidv4 } from "uuid";
import { BusinessRuleError } from "@/core/domain/error";
import { ImageErrorCode } from "./errorCode";

// ImageId
export type ImageId = string & { readonly brand: "ImageId" };

export function createImageId(id: string): ImageId {
  return id as ImageId;
}

export function generateImageId(): ImageId {
  return uuidv4() as ImageId;
}

// FileName
export type FileName = string & { readonly brand: "FileName" };

export function createFileName(name: string): FileName {
  if (!name || name.length === 0) {
    throw new BusinessRuleError(
      ImageErrorCode.InvalidFileName,
      "File name cannot be empty",
    );
  }

  if (!name.includes(".")) {
    throw new BusinessRuleError(
      ImageErrorCode.InvalidFileName,
      "File name must have an extension",
    );
  }

  return name as FileName;
}

// MimeType
const VALID_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

export type MimeType = string & { readonly brand: "MimeType" };

export function createMimeType(type: string): MimeType {
  if (!VALID_MIME_TYPES.includes(type as (typeof VALID_MIME_TYPES)[number])) {
    throw new BusinessRuleError(
      ImageErrorCode.InvalidMimeType,
      `Invalid MIME type. Must be one of: ${VALID_MIME_TYPES.join(", ")}`,
    );
  }

  return type as MimeType;
}

// FileSize
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export type FileSize = number & { readonly brand: "FileSize" };

export function createFileSize(
  size: number,
  maxSize: number = DEFAULT_MAX_FILE_SIZE,
): FileSize {
  if (size <= 0) {
    throw new BusinessRuleError(
      ImageErrorCode.InvalidFileSize,
      "File size must be greater than 0",
    );
  }

  if (size > maxSize) {
    throw new BusinessRuleError(
      ImageErrorCode.FileSizeTooLarge,
      `File size exceeds maximum of ${maxSize} bytes`,
    );
  }

  return size as FileSize;
}

// StoragePath
export type StoragePath = string & { readonly brand: "StoragePath" };

export function createStoragePath(path: string): StoragePath {
  if (!path || path.length === 0) {
    throw new BusinessRuleError(
      ImageErrorCode.InvalidStoragePath,
      "Storage path cannot be empty",
    );
  }

  return path as StoragePath;
}

// Timestamp
export type Timestamp = Date & { readonly brand: "Timestamp" };

export function createTimestamp(date: Date): Timestamp {
  return date as Timestamp;
}

export function nowTimestamp(): Timestamp {
  return new Date() as Timestamp;
}

// ImageDimensions
export type ImageDimensions = {
  width: number;
  height: number;
};

export function createImageDimensions(
  width: number,
  height: number,
): ImageDimensions {
  if (width <= 0 || height <= 0) {
    throw new BusinessRuleError(
      ImageErrorCode.InvalidDimensions,
      "Image dimensions must be greater than 0",
    );
  }

  return { width, height };
}
