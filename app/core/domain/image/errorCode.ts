export const ImageErrorCode = {
  InvalidFileName: "INVALID_FILE_NAME",
  InvalidMimeType: "INVALID_MIME_TYPE",
  InvalidFileSize: "INVALID_FILE_SIZE",
  FileSizeTooLarge: "FILE_SIZE_TOO_LARGE",
  InvalidDimensions: "INVALID_DIMENSIONS",
  InvalidStoragePath: "INVALID_STORAGE_PATH",
} as const;
export type ImageErrorCode =
  (typeof ImageErrorCode)[keyof typeof ImageErrorCode];
