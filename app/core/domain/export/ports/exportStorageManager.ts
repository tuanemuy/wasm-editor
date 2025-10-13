import type { Result } from "neverthrow";
import type { Path } from "@/core/domain/asset/valueObject";
import type { ExternalServiceError } from "@/core/error/adapter";

/**
 * Export storage manager interface
 * Manages storage operations for exported files (implementation agnostic)
 */
export interface ExportStorageManager {
  /**
   * Save to the specified path
   */
  save(
    file: File,
    destinationPath: Path,
  ): Promise<Result<Path, ExternalServiceError>>;

  /**
   * Open a dialog and save
   */
  saveWithDialog(
    file: File,
    suggestedName: string,
  ): Promise<Result<Path, ExternalServiceError>>;
}
