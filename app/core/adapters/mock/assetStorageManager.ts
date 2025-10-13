import { err, ok, type Result } from "neverthrow";
import type { AssetStorageManager } from "@/core/domain/asset/ports/assetStorageManager";
import type { Path } from "@/core/domain/asset/valueObject";
import { ExternalServiceError } from "@/core/error/adapter";

/**
 * Mock asset storage manager for testing
 */
export class MockAssetStorageManager implements AssetStorageManager {
  private files: Map<Path, File> = new Map();
  private shouldFailSave = false;
  private shouldFailRead = false;
  private shouldFailDelete = false;
  private shouldFailGetUrl = false;

  /**
   * Set whether save should fail
   */
  setShouldFailSave(shouldFail: boolean): void {
    this.shouldFailSave = shouldFail;
  }

  /**
   * Set whether read should fail
   */
  setShouldFailRead(shouldFail: boolean): void {
    this.shouldFailRead = shouldFail;
  }

  /**
   * Set whether delete should fail
   */
  setShouldFailDelete(shouldFail: boolean): void {
    this.shouldFailDelete = shouldFail;
  }

  /**
   * Set whether getUrl should fail
   */
  setShouldFailGetUrl(shouldFail: boolean): void {
    this.shouldFailGetUrl = shouldFail;
  }

  /**
   * Save data to storage
   */
  async save(
    file: File,
    destinationPath: Path,
  ): Promise<Result<Path, ExternalServiceError>> {
    if (this.shouldFailSave) {
      return err(new ExternalServiceError("Mock storage save error"));
    }

    this.files.set(destinationPath, file);
    return ok(destinationPath);
  }

  /**
   * Read data from storage
   */
  async read(path: Path): Promise<Result<File, ExternalServiceError>> {
    if (this.shouldFailRead) {
      return err(new ExternalServiceError("Mock storage read error"));
    }

    const file = this.files.get(path);
    if (!file) {
      return err(new ExternalServiceError("File not found"));
    }

    return ok(file);
  }

  /**
   * Delete data from storage
   */
  async delete(path: Path): Promise<Result<void, ExternalServiceError>> {
    if (this.shouldFailDelete) {
      return err(new ExternalServiceError("Mock storage delete error"));
    }

    this.files.delete(path);
    return ok(undefined);
  }

  /**
   * Get a data URL for displaying in the browser
   */
  async getUrl(path: Path): Promise<Result<string, ExternalServiceError>> {
    if (this.shouldFailGetUrl) {
      return err(new ExternalServiceError("Mock storage getUrl error"));
    }

    const file = this.files.get(path);
    if (!file) {
      return err(new ExternalServiceError("File not found"));
    }

    // Create a mock data URL
    return ok(`data:${file.type};base64,mock-data`);
  }

  /**
   * Reset the storage state
   */
  reset(): void {
    this.files.clear();
    this.shouldFailSave = false;
    this.shouldFailRead = false;
    this.shouldFailDelete = false;
    this.shouldFailGetUrl = false;
  }
}
