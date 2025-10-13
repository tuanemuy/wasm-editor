import {
  createFileName,
  createFileSize,
  createMimeType,
  createStoragePath,
  type FileName,
  type FileSize,
  generateImageId,
  type ImageId,
  type MimeType,
  nowTimestamp,
  type StoragePath,
  type Timestamp,
} from "./valueObject";

export type Image = Readonly<{
  id: ImageId;
  fileName: FileName;
  mimeType: MimeType;
  size: FileSize;
  width: number;
  height: number;
  storagePath: StoragePath;
  uploadedAt: Timestamp;
}>;

export type CreateImageParams = {
  fileName: string;
  mimeType: string;
  size: number;
  width: number;
  height: number;
  storagePath: string;
  maxSize?: number;
};

export function createImage(params: CreateImageParams): Image {
  return {
    id: generateImageId(),
    fileName: createFileName(params.fileName),
    mimeType: createMimeType(params.mimeType),
    size: createFileSize(params.size, params.maxSize),
    width: params.width,
    height: params.height,
    storagePath: createStoragePath(params.storagePath),
    uploadedAt: nowTimestamp(),
  };
}

/**
 * Generate image markdown reference
 */
export function generateImageMarkdown(image: Image, alt?: string): string {
  return `![${alt || image.fileName}](image://${image.id})`;
}

/**
 * Extract image IDs from content
 */
export function extractImageIdsFromContent(content: string): ImageId[] {
  const pattern = /!\[.*?\]\(image:\/\/([a-f0-9-]+)\)/g;
  const matches = content.matchAll(pattern);
  const imageIds = new Set<string>();

  for (const match of matches) {
    imageIds.add(match[1]);
  }

  return Array.from(imageIds) as ImageId[];
}
