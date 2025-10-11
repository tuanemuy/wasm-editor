import type { Result } from "neverthrow";
import type { ExternalServiceError } from "@/core/error/adapter";
import type { DatabaseConnection } from "../entity";
import type { DatabasePath } from "../valueObject";

/**
 * Database manager interface
 * Manages database connections and file operations
 */
export interface DatabaseManager {
  /**
   * Create a new database file and connect to it
   */
  create(
    dbPath: DatabasePath,
  ): Promise<Result<DatabaseConnection, ExternalServiceError>>;

  /**
   * Open an existing database file and connect to it
   */
  open(
    dbPath: DatabasePath,
  ): Promise<Result<DatabaseConnection, ExternalServiceError>>;

  /**
   * Close the current database connection
   */
  close(): Promise<Result<void, ExternalServiceError>>;

  /**
   * Get the current database connection
   */
  getConnection(): Result<DatabaseConnection | null, ExternalServiceError>;

  /**
   * Check if the database is open
   */
  isOpen(): boolean;

  /**
   * Export the database file to a different location (backup)
   */
  exportToFile(
    destinationPath: DatabasePath,
  ): Promise<Result<void, ExternalServiceError>>;

  /**
   * Import a database file from a different location
   */
  importFromFile(
    sourcePath: DatabasePath,
  ): Promise<Result<DatabaseConnection, ExternalServiceError>>;
}
