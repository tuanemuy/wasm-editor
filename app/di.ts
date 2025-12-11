/**
 * DI Container
 *
 * - getContainer(): For use in loaders
 * - getContainerSync(): For synchronous access (returns null if not ready)
 */

import { BrowserExporter } from "@/core/adapters/browser/exporter";
import { BrowserSettingsRepository } from "@/core/adapters/browser/settingsRepository";
import { BrowserTagExtractor } from "@/core/adapters/browser/tagExtractor";
import {
  type Database,
  forceCloseConnection,
  getDatabase,
} from "@/core/adapters/tursoWasm/client";
import { TursoWasmNoteQueryService } from "@/core/adapters/tursoWasm/noteQueryService";
import { TursoWasmTagQueryService } from "@/core/adapters/tursoWasm/tagQueryService";
import { TursoWasmUnitOfWorkProvider } from "@/core/adapters/tursoWasm/unitOfWork";
import type { Container } from "@/core/application/container";
import { TagCleanupService, TagSyncService } from "@/core/domain/tag/service";

async function createContainer(): Promise<Container> {
  const databasePath = import.meta.env.VITE_DATABASE_PATH;

  if (!databasePath) {
    throw new Error("VITE_DATABASE_PATH is not defined");
  }

  const db = await getDatabase(databasePath);

  return {
    unitOfWorkProvider: new TursoWasmUnitOfWorkProvider(db),
    noteQueryService: new TursoWasmNoteQueryService(db),
    tagQueryService: new TursoWasmTagQueryService(db),
    tagCleanupService: new TagCleanupService(),
    tagSyncService: new TagSyncService(),
    exporter: new BrowserExporter(),
    tagExtractor: new BrowserTagExtractor(),
    settingsRepository: new BrowserSettingsRepository(),
  };
}

type ContainerCache =
  | { status: "uninitialized" }
  | { status: "pending"; promise: Promise<Container> }
  | { status: "ready"; container: Container };

let cache: ContainerCache = { status: "uninitialized" };

// HMR: Reset cache before hot reload
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cache = { status: "uninitialized" };
  });
}

export function getContainerCache(): ContainerCache {
  return cache;
}

export async function getContainer(): Promise<Container> {
  switch (cache.status) {
    case "ready":
      return cache.container;
    case "pending":
      return cache.promise;
    case "uninitialized": {
      const promise = createContainer().then((container) => {
        cache = { status: "ready", container };
        return container;
      });
      cache = { status: "pending", promise };
      return promise;
    }
  }
}

export function getContainerSync(): Container | null {
  if (cache.status !== "ready") {
    return null;
  }
  return cache.container;
}
