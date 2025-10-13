import type { Result } from "neverthrow";
import type { ExternalServiceError } from "@/core/error/adapter";
import type { Path } from "../valueObject";

/**
 * Asset storage manager interface
 * Manages storage operations for asset files (implementation agnostic)
 */
export interface AssetStorageManager {
  /**
   * Save data to storage
   */
  save(
    file: File,
    destinationPath: Path,
  ): Promise<Result<Path, ExternalServiceError>>;

  /**
   * Read data from storage
   */
  read(path: Path): Promise<Result<File, ExternalServiceError>>;

  /**
   * Delete data from storage
   */
  delete(path: Path): Promise<Result<void, ExternalServiceError>>;

  /**
   * Get a data URL for displaying in the browser
   */
  getUrl(path: Path): Promise<Result<string, ExternalServiceError>>;
}
