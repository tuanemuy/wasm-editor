import type { ExportPort } from "@/core/domain/note/ports/exportPort";
import type { NoteQueryService } from "@/core/domain/note/ports/noteQueryService";
import type { SettingsRepository } from "@/core/domain/settings/ports/settingsRepository";
import type { TagCleanupScheduler } from "@/core/domain/tag/cleanupScheduler";
import type { TagExtractorPort } from "@/core/domain/tag/ports/tagExtractorPort";
import type { TagQueryService } from "@/core/domain/tag/ports/tagQueryService";
import type { TagCleanupService } from "@/core/domain/tag/service";
import type { UnitOfWorkProvider } from "./unitOfWork";

/**
 * Dependency Injection Container
 */
export type Container = {
  unitOfWorkProvider: UnitOfWorkProvider;
  noteQueryService: NoteQueryService;
  tagQueryService: TagQueryService;
  tagCleanupService: TagCleanupService;
  tagCleanupScheduler: TagCleanupScheduler;
  exportPort: ExportPort;
  tagExtractorPort: TagExtractorPort;
  settingsRepository: SettingsRepository;
};
