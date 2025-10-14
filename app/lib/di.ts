import { BrowserExportPort } from "@/core/adapters/browser/exportPort";
import { BrowserSettingsRepository } from "@/core/adapters/browser/settingsRepository";
import { BrowserTagExtractorPort } from "@/core/adapters/browser/tagExtractorPort";
import { getDatabase } from "@/core/adapters/tursoWasm/client";
import { initializeDatabase } from "@/core/adapters/tursoWasm/init";
import { TursoWasmNoteQueryService } from "@/core/adapters/tursoWasm/noteQueryService";
import { TursoWasmTagQueryService } from "@/core/adapters/tursoWasm/tagQueryService";
import { TursoWasmUnitOfWorkProvider } from "@/core/adapters/tursoWasm/unitOfWork";
import type { Context } from "@/core/application/context";

// Singleton instance
let contextInstance: Context | null = null;
let isInitializing = false;
let initializationPromise: Promise<Context> | null = null;

/**
 * Creates and initializes the application context with all dependencies (singleton pattern)
 */
export async function createContext(): Promise<Context> {
  // Return existing instance if already created
  if (contextInstance) {
    return contextInstance;
  }

  // Wait for ongoing initialization
  if (isInitializing && initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  isInitializing = true;
  initializationPromise = (async () => {
    // Initialize database
    const db = await getDatabase("wasm-editor.db");

    // Initialize database schema
    await initializeDatabase(db);

    // Create adapters
    const unitOfWorkProvider = new TursoWasmUnitOfWorkProvider(db);
    const noteQueryService = new TursoWasmNoteQueryService(db);
    const tagQueryService = new TursoWasmTagQueryService(db);
    const exportPort = new BrowserExportPort();
    const tagExtractorPort = new BrowserTagExtractorPort();
    const settingsRepository = new BrowserSettingsRepository();

    contextInstance = {
      unitOfWorkProvider,
      noteQueryService,
      tagQueryService,
      exportPort,
      tagExtractorPort,
      settingsRepository,
    };

    isInitializing = false;
    return contextInstance;
  })();

  return initializationPromise;
}
