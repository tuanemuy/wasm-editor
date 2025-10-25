import { BrowserExportPort } from "@/core/adapters/browser/exportPort";
import { BrowserSettingsRepository } from "@/core/adapters/browser/settingsRepository";
import { BrowserTagExtractorPort } from "@/core/adapters/browser/tagExtractorPort";
import { getDatabase, type Database } from "@/core/adapters/tursoWasm/client";
import { TursoWasmNoteQueryService } from "@/core/adapters/tursoWasm/noteQueryService";
import { TursoWasmTagQueryService } from "@/core/adapters/tursoWasm/tagQueryService";
import { TursoWasmUnitOfWorkProvider } from "@/core/adapters/tursoWasm/unitOfWork";
import type { Container } from "@/core/application/container";

// biome-ignore lint/suspicious/noExplicitAny: any
export function withContainer<T extends any[], K>(
  fn: (container: Container, ...args: T) => Promise<K>,
): (...args: T) => Promise<K> {
  return async (...args: T) => {
    const database = await getDatabase(import.meta.env.VITE_DATABASE_PATH);
    const container = createContainer(database);
    return fn(container, ...args);
  };
}

export function createContainer(db: Database): Container {
  const unitOfWorkProvider = new TursoWasmUnitOfWorkProvider(db);
  const noteQueryService = new TursoWasmNoteQueryService(db);
  const tagQueryService = new TursoWasmTagQueryService(db);
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
