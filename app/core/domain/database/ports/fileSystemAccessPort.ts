export interface FileSystemAccessPort {
  /**
   * Open file picker dialog and select a database file
   * @throws {SystemError}
   */
  openFilePicker(options?: {
    accept?: { [key: string]: string[] };
    suggestedName?: string;
  }): Promise<FileSystemFileHandle>;

  /**
   * Open save file picker dialog and create a new database file
   * @throws {SystemError}
   */
  saveFilePicker(options?: {
    suggestedName?: string;
    types?: { description: string; accept: { [key: string]: string[] } }[];
  }): Promise<FileSystemFileHandle>;

  /**
   * Read file from handle
   * @throws {SystemError}
   */
  readFile(handle: FileSystemFileHandle): Promise<ArrayBuffer>;

  /**
   * Write data to file handle
   * @throws {SystemError}
   */
  writeFile(handle: FileSystemFileHandle, data: ArrayBuffer): Promise<void>;

  /**
   * Verify and request permission
   * @throws {SystemError}
   */
  verifyPermission(
    handle: FileSystemFileHandle,
    mode: "read" | "readwrite",
  ): Promise<boolean>;

  /**
   * Get file name from handle
   */
  getFileName(handle: FileSystemFileHandle): string;

  /**
   * Get file path from handle (if available)
   * @throws {SystemError}
   */
  getFilePath(handle: FileSystemFileHandle): Promise<string | null>;
}
