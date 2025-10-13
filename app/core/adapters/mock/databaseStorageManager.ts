import { err, ok, type Result } from "neverthrow";
import type { DatabaseStorageManager } from "@/core/domain/database/ports/databaseStorageManager";
import type { DatabasePath } from "@/core/domain/database/valueObject";
import { ExternalServiceError } from "@/core/error/adapter";

/**
 * Mock database storage manager for testing
 */
export class MockDatabaseStorageManager implements DatabaseStorageManager {
  private shouldFailOpen = false;
  private shouldFailSave = false;
  private mockFile: File | null = null;
  private mockPath: DatabasePath | null = null;

  /**
   * Set whether open should fail
   */
  setShouldFailOpen(shouldFail: boolean): void {
    this.shouldFailOpen = shouldFail;
  }

  /**
   * Set whether save should fail
   */
  setShouldFailSave(shouldFail: boolean): void {
    this.shouldFailSave = shouldFail;
  }

  /**
   * Set mock file to return
   */
  setMockFile(file: File): void {
    this.mockFile = file;
  }

  /**
   * Set mock path to return
   */
  setMockPath(path: DatabasePath): void {
    this.mockPath = path;
  }

  /**
   * Open a dialog and return the selected file
   */
  async openWithDialog(): Promise<Result<File, ExternalServiceError>> {
    if (this.shouldFailOpen) {
      return err(
        new ExternalServiceError("Mock file open dialog cancelled or failed"),
      );
    }

    if (this.mockFile) {
      return ok(this.mockFile);
    }

    // Default mock file
    const defaultFile = new File([], "test-database.db");
    return ok(defaultFile);
  }

  /**
   * Open a dialog and save the file
   */
  async saveWithDialog(
    _file: File,
    suggestedName: string,
  ): Promise<Result<DatabasePath, ExternalServiceError>> {
    if (this.shouldFailSave) {
      return err(
        new ExternalServiceError("Mock file save dialog cancelled or failed"),
      );
    }

    if (this.mockPath) {
      return ok(this.mockPath);
    }

    // Default mock path
    return ok(suggestedName);
  }

  /**
   * Reset the manager state
   */
  reset(): void {
    this.shouldFailOpen = false;
    this.shouldFailSave = false;
    this.mockFile = null;
    this.mockPath = null;
  }
}
