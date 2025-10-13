export type DatabaseConnection = {
  handle: FileSystemFileHandle;
  // Add other connection properties as needed
};

export interface DatabaseConnectionPort {
  /**
   * Connect to database
   * @throws {SystemError}
   */
  connect(handle: FileSystemFileHandle): Promise<void>;

  /**
   * Disconnect from database
   * @throws {SystemError}
   */
  disconnect(): Promise<void>;

  /**
   * Check if connected
   */
  isConnected(): boolean;

  /**
   * Get current connection
   */
  getCurrentConnection(): DatabaseConnection | null;

  /**
   * Initialize database (create tables)
   * @throws {SystemError}
   */
  initialize(): Promise<void>;

  /**
   * Migrate database to target version
   * @throws {SystemError}
   */
  migrate(targetVersion: number): Promise<void>;
}
