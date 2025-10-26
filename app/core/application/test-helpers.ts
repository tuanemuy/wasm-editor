/**
 * Test helpers for Application layer
 */
import { EmptyExporter } from "@/core/adapters/empty/exporter";
import { EmptyNoteQueryService } from "@/core/adapters/empty/noteQueryService";
import { EmptySettingsRepository } from "@/core/adapters/empty/settingsRepository";
import { EmptyTagExtractor } from "@/core/adapters/empty/tagExtractor";
import { EmptyTagQueryService } from "@/core/adapters/empty/tagQueryService";
import { EmptyUnitOfWorkProvider } from "@/core/adapters/empty/unitOfWork";
import { TagCleanupService, TagSyncService } from "@/core/domain/tag/service";
import type { Context } from "./context";

/**
 * Create a test context with empty implementations
 * Returns both the context and the unitOfWorkProvider for test assertions
 */
export function createTestContext(): {
  context: Context;
  unitOfWorkProvider: EmptyUnitOfWorkProvider;
} {
  const unitOfWorkProvider = new EmptyUnitOfWorkProvider();
  const context: Context = {
    unitOfWorkProvider,
    noteQueryService: new EmptyNoteQueryService(),
    tagQueryService: new EmptyTagQueryService(),
    tagCleanupService: new TagCleanupService(),
    tagSyncService: new TagSyncService(),
    exporter: new EmptyExporter(),
    tagExtractor: new EmptyTagExtractor(),
    settingsRepository: new EmptySettingsRepository(),
  };

  return { context, unitOfWorkProvider };
}
