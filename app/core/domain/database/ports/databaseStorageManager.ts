import type { Result } from "neverthrow";
import type { ExternalServiceError } from "@/core/error/adapter";
import type { DatabasePath } from "../valueObject";

/**
 * Database storage manager interface
 * Manages storage operations for database files (implementation agnostic)
 */
export interface DatabaseStorageManager {
  /**
   * Open a dialog and return the selected file
   */
  openWithDialog(): Promise<Result<File, ExternalServiceError>>;

  /**
   * Open a dialog and save the file
   */
  saveWithDialog(
    file: File,
    suggestedName: string,
  ): Promise<Result<DatabasePath, ExternalServiceError>>;
}
