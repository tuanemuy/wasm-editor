import { err, ok, type Result } from "neverthrow";
import type { Path } from "@/core/domain/asset/valueObject";
import type { ExportStorageManager } from "@/core/domain/export/ports/exportStorageManager";
import { ExternalServiceError } from "@/core/error/adapter";

/**
 * Mock export storage manager for testing
 */
export class MockExportStorageManager implements ExportStorageManager {
  private savedFiles: Map<Path, File> = new Map();
  private shouldFailSave = false;
  private shouldFailSaveWithDialog = false;

  /**
   * Set whether save should fail
   */
  setShouldFailSave(shouldFail: boolean): void {
    this.shouldFailSave = shouldFail;
  }

  /**
   * Set whether saveWithDialog should fail
   */
  setShouldFailSaveWithDialog(shouldFail: boolean): void {
    this.shouldFailSaveWithDialog = shouldFail;
  }

  /**
   * Save to the specified path
   */
  async save(
    file: File,
    destinationPath: Path,
  ): Promise<Result<Path, ExternalServiceError>> {
    if (this.shouldFailSave) {
      return err(new ExternalServiceError("Mock storage save error"));
    }

    this.savedFiles.set(destinationPath, file);
    return ok(destinationPath);
  }

  /**
   * Open a dialog and save
   */
  async saveWithDialog(
    file: File,
    suggestedName: string,
  ): Promise<Result<Path, ExternalServiceError>> {
    if (this.shouldFailSaveWithDialog) {
      return err(new ExternalServiceError("Mock storage saveWithDialog error"));
    }

    // Simulate user selecting a path
    const path = `/mock/exports/${suggestedName}` as Path;
    this.savedFiles.set(path, file);
    return ok(path);
  }

  /**
   * Get saved files (for testing)
   */
  getSavedFiles(): Map<Path, File> {
    return this.savedFiles;
  }

  /**
   * Reset the storage state
   */
  reset(): void {
    this.savedFiles.clear();
    this.shouldFailSave = false;
    this.shouldFailSaveWithDialog = false;
  }
}
