import { BrowserExportPort } from "@/core/adapters/browser/exportPort";
import { BrowserSettingsRepository } from "@/core/adapters/browser/settingsRepository";
import { BrowserTagExtractorPort } from "@/core/adapters/browser/tagExtractorPort";
import { getDatabase } from "@/core/adapters/drizzleSqlite/client";
import { DrizzleSqliteNoteQueryService } from "@/core/adapters/drizzleSqlite/noteQueryService";
import { DrizzleSqliteTagQueryService } from "@/core/adapters/drizzleSqlite/tagQueryService";
import { DrizzleSqliteUnitOfWorkProvider } from "@/core/adapters/drizzleSqlite/unitOfWork";
import type { Context } from "@/core/application/context";

/**
 * Creates and initializes the application context with all dependencies
 */
export async function createContext(): Promise<Context> {
  // Initialize database
  const db = getDatabase("wasm-editor.db");

  // Create adapters
  const unitOfWorkProvider = new DrizzleSqliteUnitOfWorkProvider(db);
  const noteQueryService = new DrizzleSqliteNoteQueryService(db);
  const tagQueryService = new DrizzleSqliteTagQueryService(db);
  const exportPort = new BrowserExportPort();
  const tagExtractorPort = new BrowserTagExtractorPort();
  const settingsRepository = new BrowserSettingsRepository();

  return {
    unitOfWorkProvider,
    noteQueryService,
    tagQueryService,
    exportPort,
    tagExtractorPort,
    settingsRepository,
  };
}
