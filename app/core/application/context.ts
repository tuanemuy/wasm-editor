import type { DatabaseConnectionPort } from "@/core/domain/database/ports/databaseConnectionPort";
import type { DatabaseStoragePort } from "@/core/domain/database/ports/databaseStoragePort";
import type { FileSystemAccessPort } from "@/core/domain/database/ports/fileSystemAccessPort";
import type { ImageProcessingPort } from "@/core/domain/image/ports/imageProcessingPort";
import type { ImageStoragePort } from "@/core/domain/image/ports/imageStoragePort";
import type { ExportPort } from "@/core/domain/note/ports/exportPort";
import type { UnitOfWorkProvider } from "./unitOfWork";

/**
 * Application context containing all dependencies
 */
export type Context = {
  unitOfWorkProvider: UnitOfWorkProvider;
  exportPort: ExportPort;
  imageStoragePort: ImageStoragePort;
  imageProcessingPort: ImageProcessingPort;
  databaseConnectionPort: DatabaseConnectionPort;
  databaseStoragePort: DatabaseStoragePort;
  fileSystemAccessPort: FileSystemAccessPort;
};
