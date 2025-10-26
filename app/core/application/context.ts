import type { ExportPort } from "@/core/domain/note/ports/exportPort";
import type { NoteQueryService } from "@/core/domain/note/ports/noteQueryService";
import type { SettingsRepository } from "@/core/domain/settings/ports/settingsRepository";
import type { TagExtractorPort } from "@/core/domain/tag/ports/tagExtractorPort";
import type { TagQueryService } from "@/core/domain/tag/ports/tagQueryService";
import type {
  TagCleanupService,
  TagSyncService,
} from "@/core/domain/tag/service";
import type { UnitOfWorkProvider } from "./unitOfWork";

/**
 * Application context containing all dependencies
 */
export type Context = {
  unitOfWorkProvider: UnitOfWorkProvider;
  noteQueryService: NoteQueryService;
  tagQueryService: TagQueryService;
  tagCleanupService: TagCleanupService;
  tagSyncService: TagSyncService;
  exportPort: ExportPort;
  tagExtractorPort: TagExtractorPort;
  settingsRepository: SettingsRepository;
};
