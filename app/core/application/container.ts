import type { Exporter } from "@/core/domain/note/ports/exportPort";
import type { NoteQueryService } from "@/core/domain/note/ports/noteQueryService";
import type { SettingsRepository } from "@/core/domain/settings/ports/settingsRepository";
import type { TagExtractor } from "@/core/domain/tag/ports/tagExtractorPort";
import type { TagQueryService } from "@/core/domain/tag/ports/tagQueryService";
import type { UnitOfWorkProvider } from "./unitOfWork";

/**
 * Dependency Injection Container
 */
export type Container = {
  unitOfWorkProvider: UnitOfWorkProvider;
  noteQueryService: NoteQueryService;
  tagQueryService: TagQueryService;
  exporter: Exporter;
  tagExtractor: TagExtractor;
  settingsRepository: SettingsRepository;
};
