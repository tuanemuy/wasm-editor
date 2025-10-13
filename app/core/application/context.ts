import type { AssetStorageManager } from "@/core/domain/asset/ports/assetStorageManager";
import type { DatabaseManager } from "@/core/domain/database/ports/databaseManager";
import type { DatabaseStorageManager } from "@/core/domain/database/ports/databaseStorageManager";
import type { ExportStorageManager } from "@/core/domain/export/ports/exportStorageManager";
import type { MarkdownExporter } from "@/core/domain/export/ports/markdownExporter";
import type { UnitOfWorkProvider } from "./unitOfWork";

/**
 * Application context containing all dependencies
 */
export type Context = {
  assetStorageManager: AssetStorageManager;
  markdownExporter: MarkdownExporter;
  exportStorageManager: ExportStorageManager;
  databaseManager: DatabaseManager;
  databaseStorageManager: DatabaseStorageManager;
  unitOfWorkProvider: UnitOfWorkProvider;
};
