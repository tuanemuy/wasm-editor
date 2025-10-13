export interface DatabaseStoragePort {
  /**
   * Save last opened database file handle
   * @throws {SystemError}
   */
  saveLastOpenedHandle(handle: FileSystemFileHandle): Promise<void>;

  /**
   * Get last opened database file handle
   * @throws {SystemError}
   */
  getLastOpenedHandle(): Promise<FileSystemFileHandle | null>;

  /**
   * Clear last opened database file handle
   * @throws {SystemError}
   */
  clearLastOpenedHandle(): Promise<void>;

  /**
   * Save recent database to list
   * @throws {SystemError}
   */
  saveRecentDatabase(info: { name: string; path: string }): Promise<void>;

  /**
   * Get recent databases list
   * @throws {SystemError}
   */
  getRecentDatabases(): Promise<Array<{ name: string; path: string }>>;
}
