import { err, ok, type Result } from "neverthrow";
import {
  createDatabaseConnection,
  type DatabaseConnection,
} from "@/core/domain/database/entity";
import type { DatabaseManager } from "@/core/domain/database/ports/databaseManager";
import type { DatabasePath } from "@/core/domain/database/valueObject";
import { ExternalServiceError } from "@/core/error/adapter";

/**
 * Mock database manager for testing
 */
export class MockDatabaseManager implements DatabaseManager {
  private connection: DatabaseConnection | null = null;
  private shouldFailCreate = false;
  private shouldFailOpen = false;
  private shouldFailClose = false;
  private shouldFailGetConnection = false;

  /**
   * Set whether create should fail
   */
  setShouldFailCreate(shouldFail: boolean): void {
    this.shouldFailCreate = shouldFail;
  }

  /**
   * Set whether open should fail
   */
  setShouldFailOpen(shouldFail: boolean): void {
    this.shouldFailOpen = shouldFail;
  }

  /**
   * Set whether close should fail
   */
  setShouldFailClose(shouldFail: boolean): void {
    this.shouldFailClose = shouldFail;
  }

  /**
   * Set whether getConnection should fail
   */
  setShouldFailGetConnection(shouldFail: boolean): void {
    this.shouldFailGetConnection = shouldFail;
  }

  /**
   * Create a new database file and connect to it
   */
  async create(
    dbPath: DatabasePath,
  ): Promise<Result<DatabaseConnection, ExternalServiceError>> {
    if (this.shouldFailCreate) {
      return err(new ExternalServiceError("Mock database creation error"));
    }

    const result = createDatabaseConnection({
      dbPath,
      isOpen: true,
    });

    if (result.isErr()) {
      return err(
        new ExternalServiceError("Failed to create connection", result.error),
      );
    }

    this.connection = result.value;
    return ok(result.value);
  }

  /**
   * Open an existing database file and connect to it
   */
  async open(
    dbPath: DatabasePath,
  ): Promise<Result<DatabaseConnection, ExternalServiceError>> {
    if (this.shouldFailOpen) {
      return err(new ExternalServiceError("Mock database open error"));
    }

    const result = createDatabaseConnection({
      dbPath,
      isOpen: true,
    });

    if (result.isErr()) {
      return err(
        new ExternalServiceError("Failed to create connection", result.error),
      );
    }

    this.connection = result.value;
    return ok(result.value);
  }

  /**
   * Close the current database connection
   */
  async close(): Promise<Result<void, ExternalServiceError>> {
    if (this.shouldFailClose) {
      return err(new ExternalServiceError("Mock database close error"));
    }

    if (this.connection) {
      this.connection = null;
    }

    return ok(undefined);
  }

  /**
   * Get the current database connection
   */
  getConnection(): Result<DatabaseConnection | null, ExternalServiceError> {
    if (this.shouldFailGetConnection) {
      return err(new ExternalServiceError("Mock get connection error"));
    }

    return ok(this.connection);
  }

  /**
   * Check if the database is open
   */
  isOpen(): boolean {
    return this.connection?.isOpen ?? false;
  }

  /**
   * Reset the manager state
   */
  reset(): void {
    this.connection = null;
    this.shouldFailCreate = false;
    this.shouldFailOpen = false;
    this.shouldFailClose = false;
    this.shouldFailGetConnection = false;
  }
}
